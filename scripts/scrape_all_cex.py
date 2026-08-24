"""
CeX UK Full Catalog Scraper - Playwright + Algolia Network Intercept
Scrapes ALL games across PS5, PS4, Xbox Series X/S, Xbox One, Xbox 360
with images, prices, stock info by intercepting Algolia search responses.
"""
import asyncio
import json
import os
import sys
from datetime import datetime
from playwright.async_api import async_playwright

CATEGORIES = [
    {"platform": "PS5",      "friendlyName": "playstation5-software",  "label": "PlayStation 5"},
    {"platform": "PS4",      "friendlyName": "playstation4-software",  "label": "PlayStation 4"},
    {"platform": "XBOX_SX",  "friendlyName": "xbox-series-x-software", "label": "Xbox Series X/S"},
    {"platform": "XBOX_ONE", "friendlyName": "xbox-one-software",      "label": "Xbox One"},
    {"platform": "XBOX_360", "friendlyName": "xbox-360-software",      "label": "Xbox 360"},
]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_JSON = os.path.join(SCRIPT_DIR, "..", "src", "data", "allGames.json")
OUTPUT_TS   = os.path.join(SCRIPT_DIR, "..", "src", "data", "initialGames.ts")

TODAY = datetime.now().strftime("%Y-%m-%d")


async def scrape_category(context, cat):
    """Scrape a single category by navigating page-by-page and intercepting Algolia responses."""
    platform = cat["platform"]
    friendly = cat["friendlyName"]
    label    = cat["label"]

    all_hits = {}          # boxId -> hit dict  (dedup)
    page_num = 1
    consecutive_empty = 0  # stop after 2 consecutive empty pages

    print(f"\n{'='*60}")
    print(f"[{platform}] Scraping: {label}")
    print(f"{'='*60}")

    while True:
        url = f"https://uk.webuy.com/search?categoryFriendlyName={friendly}&page={page_num}"
        print(f"  Page {page_num}: {url}")

        # Create a fresh page for each request to avoid stale listeners
        page = await context.new_page()

        # Collect Algolia hits from network responses
        page_hits = []
        algolia_responded = asyncio.Event()

        async def on_response(response):
            if "search.webuy.io" not in response.url:
                return
            try:
                ct = response.headers.get("content-type", "")
                if "json" not in ct:
                    return
                body = await response.json()
                results = body.get("results", [])
                for r in results:
                    hits = r.get("hits", [])
                    if hits:
                        page_hits.extend(hits)
                        algolia_responded.set()
            except Exception:
                pass

        page.on("response", on_response)

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        except Exception as e:
            print(f"    Navigation error: {e}")

        # Wait up to 8 seconds for Algolia response
        try:
            await asyncio.wait_for(algolia_responded.wait(), timeout=8.0)
        except asyncio.TimeoutError:
            pass

        # Extra settle time
        await page.wait_for_timeout(1500)
        await page.close()

        if page_hits:
            new_count = 0
            for h in page_hits:
                bid = str(h.get("boxId", ""))
                if bid and bid not in all_hits:
                    all_hits[bid] = h
                    new_count += 1
            print(f"    ✓ Captured {len(page_hits)} hits, {new_count} new unique items. Total: {len(all_hits)}")
            consecutive_empty = 0
        else:
            consecutive_empty += 1
            print(f"    ✗ No hits captured (empty streak: {consecutive_empty})")
            if consecutive_empty >= 3:
                print(f"    Stopping pagination for {platform} after {consecutive_empty} empty pages.")
                break

        page_num += 1
        await asyncio.sleep(1)  # Be polite

    print(f"  [{platform}] DONE: {len(all_hits)} unique games collected.\n")
    return platform, all_hits


def transform_hit(hit, platform, cat_label):
    """Convert an Algolia hit into our GameItem format."""
    sell   = float(hit.get("sellPrice") or 0)
    cash   = float(hit.get("cashPrice") or 0) if hit.get("cashPrice") else None
    exch   = float(hit.get("exchangePrice") or 0) if hit.get("exchangePrice") else None
    box_id = str(hit.get("boxId", ""))
    imgs   = hit.get("imageUrls", {})
    img    = imgs.get("large") or imgs.get("medium") or imgs.get("small") or ""
    in_stock = (hit.get("outOfStock", 1) == 0) and (hit.get("cannotBuy", 1) == 0)

    return {
        "id": box_id,
        "title": hit.get("boxName", "Unknown"),
        "platform": platform,
        "categoryName": f"{cat_label} Software",
        "sellPrice": sell,
        "originalPrice": None,
        "cashPrice": cash,
        "exchangePrice": exch,
        "imageUrl": img,
        "inStock": in_stock,
        "stockCount": 10 if in_stock else 0,
        "condition": "Boxed",
        "rating": float(hit.get("rating") or 0) if hit.get("rating") else None,
        "genre": (hit.get("superCatFriendlyName") or "Gaming").replace("-", " ").title(),
        "cexUrl": f"https://uk.webuy.com/product-detail?id={box_id}",
        "priceHistory": [{"date": TODAY, "price": sell}],
        "lastUpdated": TODAY,
        "popular": False,
    }


def write_ts_file(games):
    """Write games list as a TypeScript module."""
    stores = '''
export const POPULAR_UK_CEX_STORES: StoreLocation[] = [
  { id: 'london-tottenham-court-rd', name: 'CeX London - Tottenham Court Road (Flagship)', city: 'London', address: '32 Rathbone Place, London W1T 1JJ', region: 'Central London', isPopularTravelSpot: true },
  { id: 'london-oxford-street', name: 'CeX London - Oxford Street', city: 'London', address: '533 Oxford St, London W1C 2QN', region: 'Central London', isPopularTravelSpot: true },
  { id: 'london-camden', name: 'CeX London - Camden Town', city: 'London', address: '228 Camden High St, London NW1 8QR', region: 'North London', isPopularTravelSpot: true },
  { id: 'london-stratford', name: 'CeX London - Stratford Westfield', city: 'London', address: 'Westfield Stratford City, London E20 1EH', region: 'East London', isPopularTravelSpot: true },
  { id: 'manchester-arndale', name: 'CeX Manchester - Arndale Centre', city: 'Manchester', address: 'Market St, Manchester M4 3AQ', region: 'Greater Manchester', isPopularTravelSpot: true },
  { id: 'birmingham-bullring', name: 'CeX Birmingham - Bullring', city: 'Birmingham', address: 'Bullring & Grand Central, Birmingham B5 4BU', region: 'West Midlands', isPopularTravelSpot: true },
  { id: 'edinburgh-princes-st', name: 'CeX Edinburgh - Princes Street Area', city: 'Edinburgh', address: 'Rose St / Princes St, Edinburgh EH2 2NL', region: 'Scotland', isPopularTravelSpot: true },
];'''

    ts = f"import {{ GameItem, StoreLocation }} from '@/types/game';\n\nexport const INITIAL_GAMES: GameItem[] = {json.dumps(games, ensure_ascii=False, indent=2)};\n{stores}\n"
    os.makedirs(os.path.dirname(OUTPUT_TS), exist_ok=True)
    with open(OUTPUT_TS, "w", encoding="utf-8") as f:
        f.write(ts)
    print(f"✓ TypeScript dataset updated: {OUTPUT_TS}")


async def main():
    print("=" * 60)
    print("  CeX UK FULL CATALOG SCRAPER")
    print(f"  Date: {TODAY}")
    print(f"  Platforms: PS5, PS4, Xbox Series X/S, Xbox One, Xbox 360")
    print("=" * 60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            viewport={"width": 1366, "height": 900},
            locale="en-GB",
        )

        all_games = []
        platform_stats = {}

        for cat in CATEGORIES:
            platform, hits_dict = await scrape_category(context, cat)
            games = [transform_hit(h, platform, cat["label"]) for h in hits_dict.values() if float(h.get("sellPrice") or 0) > 0]
            # Mark first 5 as popular
            for i, g in enumerate(games[:5]):
                g["popular"] = True
            all_games.extend(games)
            platform_stats[platform] = len(games)

        await browser.close()

    # Summary
    print("\n" + "=" * 60)
    print("  SCRAPING SUMMARY")
    print("=" * 60)
    total = len(all_games)
    for plat, count in platform_stats.items():
        print(f"  {plat:12s}: {count:5d} games")
    print(f"  {'TOTAL':12s}: {total:5d} games")
    print("=" * 60)

    if total > 0:
        # Save JSON
        os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(all_games, f, ensure_ascii=False, indent=2)
        print(f"✓ JSON saved: {OUTPUT_JSON} ({total} games)")

        # Update TypeScript
        write_ts_file(all_games)

        print(f"\n🎮 Done! {total} games scraped and saved.")
    else:
        print("\n⚠ No games scraped. The existing dataset will be kept.")
        print("  This may be due to Cloudflare blocking. Try running with headless=False.")


if __name__ == "__main__":
    asyncio.run(main())
