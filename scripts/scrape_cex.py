#!/usr/bin/env python3
"""
CeX UK Game Scraper & Price Tracker Script
Target platforms: PS5, PS4, Xbox Series X/S, Xbox One, Xbox 360
Outputs updated games data with historical price logs.
"""

import json
import time
import os
import sys
from datetime import datetime

CATEGORIES = {
    "PS5": {
        "friendlyName": "playstation5-software",
        "categoryName": "PlayStation 5 Software",
        "label": "PS5"
    },
    "PS4": {
        "friendlyName": "playstation4-software",
        "categoryName": "PlayStation 4 Software",
        "label": "PS4"
    },
    "XBOX_SX": {
        "friendlyName": "xbox-series-x-software",
        "categoryName": "Xbox Series X Software",
        "label": "XBOX_SX"
    },
    "XBOX_ONE": {
        "friendlyName": "xbox-one-software",
        "categoryName": "Xbox One Software",
        "label": "XBOX_ONE"
    },
    "XBOX_360": {
        "friendlyName": "xbox-360-software",
        "categoryName": "Xbox 360 Software",
        "label": "XBOX_360"
    }
}

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "scrapedGames.json")

def scrape_with_curl_cffi():
    try:
        from curl_cffi import requests
        session = requests.Session(impersonate="chrome124")
        all_games = []
        today = datetime.now().strftime("%Y-%m-%d")

        print(f"[{today}] Starting CeX UK Game Price Scraping...")

        for platform_key, cat_info in CATEGORIES.items():
            print(f"Fetching {cat_info['categoryName']}...")
            url = f"https://wss2.cex.uk.webuy.io/v3/boxes?categoryFriendlyName={cat_info['friendlyName']}&firstRecord=1&count=50&sortBy=relevance&sortOrder=desc"
            headers = {
                "Accept": "application/json, text/plain, */*",
                "Referer": "https://uk.webuy.com/",
                "Origin": "https://uk.webuy.com",
            }
            try:
                r = session.get(url, headers=headers, timeout=15)
                if r.status_code == 200:
                    data = r.json()
                    boxes = data.get("response", {}).get("data", {}).get("boxes", [])
                    print(f"  -> Found {len(boxes)} items for {platform_key}")
                    for b in boxes:
                        sell_price = float(b.get("sellPrice", 0))
                        cash_price = float(b.get("cashPrice", 0)) if b.get("cashPrice") else None
                        exchange_price = float(b.get("exchangePrice", 0)) if b.get("exchangePrice") else None
                        box_id = b.get("boxId") or f"{platform_key}-{len(all_games)+1}"

                        game_entry = {
                            "id": box_id,
                            "title": b.get("boxName", "Unknown Game"),
                            "platform": platform_key,
                            "categoryName": cat_info["categoryName"],
                            "sellPrice": sell_price,
                            "cashPrice": cash_price,
                            "exchangePrice": exchange_price,
                            "imageUrl": b.get("imageUrls", {}).get("large") or b.get("imageUrls", {}).get("medium") or "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80",
                            "inStock": b.get("outOfStock") == 0 and b.get("cannotBuy") == 0,
                            "stockCount": 10 if b.get("outOfStock") == 0 else 0,
                            "condition": "Boxed",
                            "rating": 4.8,
                            "cexUrl": f"https://uk.webuy.com/product-detail?id={box_id}",
                            "priceHistory": [
                                {"date": today, "price": sell_price}
                            ],
                            "lastUpdated": today
                        }
                        all_games.append(game_entry)
                else:
                    print(f"  -> Warning: Status {r.status_code} received.")
            except Exception as e:
                print(f"  -> Error fetching {platform_key}: {e}")

            time.sleep(2)

        if all_games:
            os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(all_games, f, ensure_ascii=False, indent=2)
            print(f"Scraping completed! {len(all_games)} games written to {OUTPUT_FILE}")
            return True
        else:
            print("No games retrieved in this run.")
            return False

    except ImportError:
        print("curl_cffi is not installed. Please run: pip install curl_cffi")
        return False

if __name__ == "__main__":
    scrape_with_curl_cffi()
