import requests
import json

ALGOLIA_URL = "https://search.webuy.io/1/indexes/*/queries"
PARAMS = {
    "x-algolia-agent": "Algolia for JavaScript (5.52.1)",
    "x-algolia-api-key": "bf79f2b6699e60a18ae330a1248b452c",
    "x-algolia-application-id": "LNNFEEWZVA"
}

# Test querying PS5 games
payload = {
    "requests": [
        {
            "indexName": "prod_cex_uk",
            "params": "query=&facetFilters=%5B%22categoryFriendlyName%3Aplaystation5-software%22%5D&hitsPerPage=20&page=0"
        }
    ]
}

r = requests.post(ALGOLIA_URL, params=PARAMS, json=payload)
print("Status:", r.status_code)
if r.status_code == 200:
    data = r.json()
    result = data["results"][0]
    total = result.get("nbHits")
    hits = result.get("hits", [])
    print(f"Total games in PS5 on CeX: {total}, fetched {len(hits)} hits!")
    for h in hits[:5]:
        print(f"[{h.get('boxId')}] {h.get('boxName')} - Sell: £{h.get('sellPrice')} | Cash: £{h.get('cashPrice')} | Stock: {h.get('cannotBuy') == 0}")
        print("  Image:", h.get('imageUrls', {}).get('large'))
