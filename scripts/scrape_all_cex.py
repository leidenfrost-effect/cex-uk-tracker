#!/usr/bin/env python3
"""Validated CeX UK catalog and TCMB GBP/TRY synchronizer."""
from __future__ import annotations

import argparse
import asyncio
import json
import math
import os
import re
import sys
import time
import urllib.request
import uuid
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Iterable
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

from playwright.async_api import APIRequestContext, async_playwright

PLATFORMS = ("PS5", "PS4", "XBOX_SX", "XBOX_ONE", "XBOX_360")
PLATFORM_LABELS = {
    "PS5": "PlayStation 5",
    "PS4": "PlayStation 4",
    "XBOX_SX": "Xbox Series X/S",
    "XBOX_ONE": "Xbox One",
    "XBOX_360": "Xbox 360",
}
PLATFORM_ALIASES = {
    "PS5": ("playstation5-software", "playstation-5-software", "playstation-5-games", "ps5-software"),
    "PS4": ("playstation4-software", "playstation-4-software", "playstation-4-games", "ps4-software"),
    "XBOX_SX": ("xbox-series-x-software", "xbox-series-xs-software", "xbox-series-x-games"),
    "XBOX_ONE": ("xbox-one-software", "xboxone-software", "xbox-one-games"),
    "XBOX_360": ("xbox-360-software", "xbox360-software", "xbox-360-games"),
}

ALGOLIA_APP_ID = "LNNFEEWZVA"
ALGOLIA_API_KEY = "bf79f2b6699e60a18ae330a1248b452c"
ALGOLIA_INDEX = "prod_cex_uk"
ALGOLIA_URL = "https://search.webuy.io/1/indexes/*/queries"
HITS_PER_PAGE = 100
ALGOLIA_RESULT_LIMIT = 1000
REQUEST_PAUSE_SECONDS = 0.25
ISTANBUL = ZoneInfo("Europe/Istanbul")

STOCK_FILTER = (
    "boxVisibilityOnWeb=1 AND boxSaleAllowed=1 AND sellPrice > 0 AND "
    "(inStockStore=1 OR inStockOnline=1) AND (collectionQuantity>0 OR ecomQuantity>0)"
)
ATTRIBUTES = [
    "boxId", "boxName", "sellPrice", "cashPrice", "cashBuyPrice", "exchangePrice",
    "categoryFriendlyName", "categoryName", "superCatFriendlyName", "imageUrls", "imageNames",
    "outOfStock", "outOfEcomStock", "cannotBuy", "collectionQuantity", "ecomQuantity",
    "ecomQuantityOnHand", "rating", "Grade", "boxSaleAllowed", "boxVisibilityOnWeb",
]


@dataclass(frozen=True)
class ExchangeRate:
    source_date: str
    rate: Decimal
    observed_at: datetime


class ValidationError(RuntimeError):
    pass


def normalize_category(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def platform_matches_category(platform: str, category: str) -> bool:
    normalized = normalize_category(category)
    if normalized in PLATFORM_ALIASES[platform]:
        return True
    rules = {
        "PS5": ("playstation", "5"),
        "PS4": ("playstation", "4"),
        "XBOX_SX": ("xbox", "series"),
        "XBOX_ONE": ("xbox", "one"),
        "XBOX_360": ("xbox", "360"),
    }
    return all(token in normalized for token in rules[platform]) and any(
        token in normalized for token in ("software", "game", "games")
    )


def safe_number(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        parsed = float(value)
        return parsed if math.isfinite(parsed) else None
    except (TypeError, ValueError):
        return None


def safe_count(item: dict[str, Any]) -> int | None:
    values = []
    for key in ("ecomQuantity", "collectionQuantity"):
        value = safe_number(item.get(key))
        if value is not None:
            values.append(max(0, int(value)))
    return sum(values) if values else None


def transform_item(item: dict[str, Any], platform: str) -> dict[str, Any] | None:
    box_id = str(item.get("boxId") or "").strip()
    title = str(item.get("boxName") or "").strip()
    sell_price = safe_number(item.get("sellPrice"))
    if not box_id or not title or sell_price is None or sell_price <= 0:
        return None

    image_urls = item.get("imageUrls") or {}
    image_url = image_urls.get("large") or image_urls.get("medium") or image_urls.get("small") or ""
    stock_count = safe_count(item)
    availability_flag = item.get("outOfStock") == 0 and item.get("cannotBuy", 0) == 0
    in_stock = stock_count > 0 if stock_count is not None else availability_flag
    category_name = str(item.get("categoryName") or PLATFORM_LABELS[platform] + " Software")
    grade = str(item.get("Grade") or "").lower()
    condition = "Boxed" if not grade or "boxed" in grade else "Unboxed" if "unboxed" in grade else "Standard"

    return {
        "id": box_id,
        "title": title,
        "platform": platform,
        "category_name": category_name,
        "sell_price": round(sell_price, 2),
        "cash_price": safe_number(item.get("cashPrice") or item.get("cashBuyPrice")),
        "exchange_price": safe_number(item.get("exchangePrice")),
        "image_url": str(image_url),
        "in_stock": bool(in_stock),
        "stock_count": stock_count,
        "condition": condition,
        "rating": safe_number(item.get("rating")),
        "genre": str(item.get("superCatFriendlyName") or "Gaming").replace("-", " ").title(),
        "cex_url": f"https://uk.webuy.com/product-detail?id={box_id}",
    }


class CexAlgoliaClient:
    def __init__(self, request: APIRequestContext):
        self.request = request
        self.query_string = urlencode({
            "x-algolia-agent": "Algolia for JavaScript (5.52.1); Search (5.52.1); Browser",
            "x-algolia-api-key": ALGOLIA_API_KEY,
            "x-algolia-application-id": ALGOLIA_APP_ID,
        })

    async def query(self, request_body: dict[str, Any]) -> dict[str, Any]:
        response = await self.request.post(
            f"{ALGOLIA_URL}?{self.query_string}",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Origin": "https://uk.webuy.com",
                "Referer": "https://uk.webuy.com/",
            },
            data=json.dumps({"requests": [{"indexName": ALGOLIA_INDEX, **request_body}]}),
        )
        if not response.ok:
            raise RuntimeError(f"Algolia returned HTTP {response.status}")
        body = await response.json()
        result = (body.get("results") or [{}])[0]
        if result.get("message"):
            raise RuntimeError(f"Algolia error: {result['message']}")
        return result

    async def discover_categories(self, platforms: Iterable[str]) -> dict[str, str]:
        facet_result = await self.query({
            "analytics": False,
            "clickAnalytics": False,
            "facets": ["categoryFriendlyName"],
            "filters": STOCK_FILTER,
            "hitsPerPage": 0,
            "maxValuesPerFacet": 1000,
            "page": 0,
            "query": "",
        })
        facet_values = (facet_result.get("facets") or {}).get("categoryFriendlyName") or {}
        discovered: dict[str, str] = {}
        for platform in platforms:
            candidates = [
                (name, int(count)) for name, count in facet_values.items()
                if platform_matches_category(platform, name)
            ]
            if candidates:
                discovered[platform] = max(candidates, key=lambda pair: pair[1])[0]
                continue

            probes = []
            for alias in PLATFORM_ALIASES[platform]:
                overview = await self.search(alias, page=0, hits_per_page=1)
                probes.append((alias, int(overview.get("nbHits") or 0)))
            best_alias, best_count = max(probes, key=lambda pair: pair[1])
            if best_count <= 0:
                raise ValidationError(f"No live CeX category found for {platform}; probes={probes}")
            discovered[platform] = best_alias
        return discovered

    async def search(
        self,
        category: str,
        page: int,
        hits_per_page: int = HITS_PER_PAGE,
        price_range: tuple[float, float] | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "attributesToRetrieve": ATTRIBUTES,
            "analytics": False,
            "clickAnalytics": False,
            "facetFilters": [[f"categoryFriendlyName:{category}"]],
            "facets": ["categoryFriendlyName"],
            "filters": STOCK_FILTER,
            "hitsPerPage": hits_per_page,
            "page": page,
            "query": "",
        }
        if price_range:
            low, high = price_range
            body["numericFilters"] = [f"sellPrice>={low}", f"sellPrice<{high}"]
        return await self.query(body)

    async def fetch_window(self, category: str, price_range: tuple[float, float] | None) -> dict[str, dict[str, Any]]:
        first = await self.search(category, 0, price_range=price_range)
        total = int(first.get("nbHits") or 0)
        if total > ALGOLIA_RESULT_LIMIT:
            label = price_range or "full category"
            raise ValidationError(f"Algolia window exceeds {ALGOLIA_RESULT_LIMIT}: {category} {label}={total}")
        pages = math.ceil(total / HITS_PER_PAGE) if total else 0
        collected: dict[str, dict[str, Any]] = {}
        for page_index in range(pages):
            result = first if page_index == 0 else await self.search(
                category, page_index, price_range=price_range
            )
            hits = result.get("hits") or []
            for hit in hits:
                box_id = str(hit.get("boxId") or "")
                if box_id:
                    collected[box_id] = hit
            if page_index + 1 < pages:
                await asyncio.sleep(REQUEST_PAUSE_SECONDS)
        if len(collected) != total:
            raise ValidationError(f"Incomplete window for {category}: expected={total}, unique={len(collected)}")
        return collected

    async def fetch_category(self, category: str) -> dict[str, dict[str, Any]]:
        overview = await self.search(category, 0, hits_per_page=1)
        total = int(overview.get("nbHits") or 0)
        if total <= ALGOLIA_RESULT_LIMIT:
            return await self.fetch_window(category, None)

        collected: dict[str, dict[str, Any]] = {}
        price_edges = (0, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 250, 500, 1000, 1000000)
        for low, high in zip(price_edges, price_edges[1:]):
            window_overview = await self.search(category, 0, hits_per_page=1, price_range=(low, high))
            window_total = int(window_overview.get("nbHits") or 0)
            if window_total > ALGOLIA_RESULT_LIMIT:
                raise ValidationError(
                    f"Price shard too large for complete retrieval: {category} £{low}-{high}={window_total}"
                )
            collected.update(await self.fetch_window(category, (low, high)))
            await asyncio.sleep(REQUEST_PAUSE_SECONDS)
        if len(collected) != total:
            raise ValidationError(f"Incomplete category {category}: expected={total}, unique={len(collected)}")
        return collected


def validate_catalog(games_by_platform: dict[str, list[dict[str, Any]]], min_items: int) -> None:
    seen: dict[str, str] = {}
    for platform, games in games_by_platform.items():
        if len(games) < min_items:
            raise ValidationError(f"{platform} has only {len(games)} items; minimum is {min_items}")
        for game in games:
            existing_platform = seen.get(game["id"])
            if existing_platform and existing_platform != platform:
                raise ValidationError(
                    f"Cross-platform duplicate {game['id']}: {existing_platform} and {platform}"
                )
            seen[game["id"]] = platform


def parse_tcmb_xml(payload: bytes, observed_at: datetime | None = None) -> ExchangeRate:
    root = ET.fromstring(payload)
    currency = next(node for node in root.findall("Currency") if node.attrib.get("CurrencyCode") == "GBP")
    unit = Decimal((currency.findtext("Unit") or "1").strip())
    selling = Decimal((currency.findtext("ForexSelling") or "0").strip())
    rate = selling / unit
    if rate <= 0:
        raise ValueError("TCMB GBP ForexSelling is missing or invalid")
    raw_date = root.attrib.get("Date") or root.attrib.get("Tarih")
    if not raw_date:
        raise ValueError("TCMB source date is missing")
    source_date = datetime.strptime(raw_date, "%m/%d/%Y").date().isoformat()
    return ExchangeRate(source_date=source_date, rate=rate, observed_at=observed_at or datetime.now(timezone.utc))


def fetch_tcmb_rate(attempts: int = 3) -> ExchangeRate:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(
                "https://www.tcmb.gov.tr/kurlar/today.xml",
                headers={"User-Agent": "cex-uk-game-tracker/2.0", "Accept": "application/xml,text/xml"},
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                return parse_tcmb_xml(response.read())
        except Exception as exc:
            last_error = exc
            if attempt + 1 < attempts:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"TCMB rate fetch failed after {attempts} attempts: {last_error}")


def comparable_game(game: dict[str, Any]) -> tuple[Any, ...]:
    return (
        game["sell_price"], game.get("cash_price"), game.get("exchange_price"),
        game["in_stock"], game.get("stock_count"),
    )


def start_sync_run(connection: Any, trigger: str, external_run_id: str | None) -> str:
    with connection.cursor() as cursor:
        cursor.execute("SELECT pg_try_advisory_lock(hashtext('cex-price-sync'))")
        if not cursor.fetchone()[0]:
            raise RuntimeError("Another catalog synchronization is already running")
        cursor.execute(
            """INSERT INTO sync_runs (external_run_id, trigger, status)
               VALUES (%s, %s, 'running')
               ON CONFLICT (external_run_id) DO UPDATE SET
                 trigger = EXCLUDED.trigger, status = 'running', started_at = now(), finished_at = NULL,
                 error_summary = NULL
               RETURNING id""",
            (external_run_id, trigger),
        )
        return str(cursor.fetchone()[0])


def write_snapshot(
    connection: Any,
    run_id: str,
    games_by_platform: dict[str, list[dict[str, Any]]],
    rate: ExchangeRate | None,
    rate_error: str | None,
) -> int:
    all_games = [game for games in games_by_platform.values() for game in games]
    observed_date = datetime.now(ISTANBUL).date().isoformat()
    with connection.transaction():
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT box_id, sell_price, cash_price, exchange_price, in_stock, stock_count, platform "
                "FROM games WHERE is_active = true"
            )
            existing = {
                str(row[0]): {
                    "sell_price": float(row[1]), "cash_price": float(row[2]) if row[2] is not None else None,
                    "exchange_price": float(row[3]) if row[3] is not None else None,
                    "in_stock": bool(row[4]), "stock_count": row[5], "platform": row[6],
                }
                for row in cursor.fetchall()
            }
            changed = [game for game in all_games if game["id"] not in existing or comparable_game(game) != comparable_game(existing[game["id"]])]

            upsert_sql = """
                INSERT INTO games (
                  box_id, title, platform, category_name, sell_price, cash_price, exchange_price,
                  image_url, in_stock, stock_count, condition, rating, genre, cex_url,
                  is_active, first_seen_at, last_seen_at, last_changed_at, last_sync_id
                ) VALUES (
                  %(id)s, %(title)s, %(platform)s, %(category_name)s, %(sell_price)s,
                  %(cash_price)s, %(exchange_price)s, %(image_url)s, %(in_stock)s,
                  %(stock_count)s, %(condition)s, %(rating)s, %(genre)s, %(cex_url)s,
                  true, now(), now(), now(), %(run_id)s
                )
                ON CONFLICT (box_id) DO UPDATE SET
                  title = EXCLUDED.title, platform = EXCLUDED.platform, category_name = EXCLUDED.category_name,
                  previous_sell_price = CASE WHEN games.sell_price IS DISTINCT FROM EXCLUDED.sell_price
                    THEN games.sell_price ELSE games.previous_sell_price END,
                  sell_price = EXCLUDED.sell_price, cash_price = EXCLUDED.cash_price,
                  exchange_price = EXCLUDED.exchange_price, image_url = EXCLUDED.image_url,
                  in_stock = EXCLUDED.in_stock, stock_count = EXCLUDED.stock_count,
                  condition = EXCLUDED.condition, rating = EXCLUDED.rating, genre = EXCLUDED.genre,
                  cex_url = EXCLUDED.cex_url, is_active = true, last_seen_at = now(),
                  last_changed_at = CASE WHEN
                    (games.sell_price, games.cash_price, games.exchange_price, games.in_stock, games.stock_count)
                    IS DISTINCT FROM
                    (EXCLUDED.sell_price, EXCLUDED.cash_price, EXCLUDED.exchange_price, EXCLUDED.in_stock, EXCLUDED.stock_count)
                    THEN now() ELSE games.last_changed_at END,
                  last_sync_id = EXCLUDED.last_sync_id
            """
            cursor.executemany(upsert_sql, [{**game, "run_id": run_id} for game in all_games])

            history_sql = """
                INSERT INTO game_state_changes (
                  game_id, observed_date, sell_price, cash_price, exchange_price,
                  in_stock, stock_count, sync_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (game_id, observed_date) DO UPDATE SET
                  observed_at = now(), sell_price = EXCLUDED.sell_price,
                  cash_price = EXCLUDED.cash_price, exchange_price = EXCLUDED.exchange_price,
                  in_stock = EXCLUDED.in_stock, stock_count = EXCLUDED.stock_count, sync_id = EXCLUDED.sync_id
            """
            cursor.executemany(history_sql, [
                (game["id"], observed_date, game["sell_price"], game.get("cash_price"),
                 game.get("exchange_price"), game["in_stock"], game.get("stock_count"), run_id)
                for game in changed
            ])

            current_ids = {game["id"] for game in all_games}
            missing = [box_id for box_id in existing if box_id not in current_ids]
            if missing:
                cursor.execute(
                    "UPDATE games SET is_active = false, in_stock = false, stock_count = 0, "
                    "last_changed_at = now(), last_sync_id = %s WHERE box_id = ANY(%s::text[])",
                    (run_id, missing),
                )
                cursor.executemany(history_sql, [
                    (box_id, observed_date, existing[box_id]["sell_price"], existing[box_id]["cash_price"],
                     existing[box_id]["exchange_price"], False, 0, run_id)
                    for box_id in missing if existing[box_id]["in_stock"]
                ])

            if rate:
                cursor.execute(
                    """INSERT INTO exchange_rates (source_date, observed_at, rate, source, sync_id)
                       VALUES (%s, %s, %s, 'TCMB', %s)
                       ON CONFLICT (source_date) DO UPDATE SET
                         observed_at = EXCLUDED.observed_at, rate = EXCLUDED.rate, sync_id = EXCLUDED.sync_id""",
                    (rate.source_date, rate.observed_at, rate.rate, run_id),
                )

            status = "succeeded" if rate else "partial"
            cursor.execute(
                """UPDATE sync_runs SET status = %s, finished_at = now(), platform_counts = %s::jsonb,
                   games_seen = %s, games_changed = %s, exchange_rate_updated = %s, error_summary = %s
                   WHERE id = %s""",
                (status, json.dumps({p: len(g) for p, g in games_by_platform.items()}), len(all_games),
                 len(changed) + len(missing), bool(rate), rate_error, run_id),
            )
    return len(changed)


def mark_failed(connection: Any, run_id: str, error: Exception) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            "UPDATE sync_runs SET status = 'failed', finished_at = now(), error_summary = %s WHERE id = %s",
            (str(error)[:1000], run_id),
        )


async def scrape_catalog(platforms: list[str], headed: bool) -> tuple[dict[str, list[dict[str, Any]]], dict[str, str]]:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=not headed)
        context = await browser.new_context(
            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"),
            locale="en-GB",
        )
        page = await context.new_page()
        response = await page.goto("https://uk.webuy.com/", wait_until="domcontentloaded", timeout=60000)
        if not response or response.status >= 400:
            raise RuntimeError(f"CeX bootstrap page failed: HTTP {response.status if response else 'none'}")
        await page.wait_for_timeout(2500)
        client = CexAlgoliaClient(context.request)
        categories = await client.discover_categories(platforms)
        games_by_platform: dict[str, list[dict[str, Any]]] = {}
        for platform in platforms:
            category = categories[platform]
            print(f"[{platform}] category={category}")
            hits = await client.fetch_category(category)
            games = [game for hit in hits.values() if (game := transform_item(hit, platform))]
            games.sort(key=lambda game: game["title"].lower())
            games_by_platform[platform] = games
            print(f"[{platform}] validated items={len(games)}")
        await browser.close()
        return games_by_platform, categories


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Synchronize validated CeX UK game prices to Neon.")
    parser.add_argument("--platforms", default=",".join(PLATFORMS))
    parser.add_argument("--min-items", type=int, default=int(os.getenv("MIN_ITEMS_PER_PLATFORM", "25")))
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Scrape and validate without writing to Postgres")
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    platforms = [value.strip().upper() for value in args.platforms.split(",") if value.strip()]
    invalid = set(platforms) - set(PLATFORMS)
    if invalid:
        raise SystemExit(f"Unknown platforms: {sorted(invalid)}")
    if not args.dry_run and set(platforms) != set(PLATFORMS):
        raise SystemExit("Database writes require a complete five-platform scrape; use --dry-run for partial smoke tests.")

    connection = None
    run_id = None
    try:
        if not args.dry_run:
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                raise RuntimeError("DATABASE_URL is required unless --dry-run is used")
            import psycopg
            connection = psycopg.connect(database_url, autocommit=True)
            event_name = os.getenv("GITHUB_EVENT_NAME", "local")
            trigger = "schedule" if event_name == "schedule" else "manual" if event_name == "workflow_dispatch" else "local"
            run_id = start_sync_run(connection, trigger, os.getenv("GITHUB_RUN_ID"))

        games_by_platform, categories = await scrape_catalog(platforms, args.headed)
        validate_catalog(games_by_platform, args.min_items)
        total = sum(len(games) for games in games_by_platform.values())
        print(json.dumps({"categories": categories, "counts": {p: len(g) for p, g in games_by_platform.items()}, "total": total}, indent=2))

        rate = None
        rate_error = None
        try:
            rate = await asyncio.to_thread(fetch_tcmb_rate)
            print(f"TCMB GBP/TRY={rate.rate} source_date={rate.source_date}")
        except Exception as exc:
            rate_error = str(exc)
            print(f"WARNING: {rate_error}", file=sys.stderr)

        if args.dry_run:
            return
        changed = write_snapshot(connection, run_id, games_by_platform, rate, rate_error)
        print(f"Neon sync complete: seen={total}, changed={changed}, status={'succeeded' if rate else 'partial'}")
    except Exception as exc:
        if connection and run_id:
            mark_failed(connection, run_id, exc)
        raise
    finally:
        if connection:
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT pg_advisory_unlock(hashtext('cex-price-sync'))")
            finally:
                connection.close()


if __name__ == "__main__":
    asyncio.run(main())
