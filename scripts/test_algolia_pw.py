import asyncio
import json
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        await page.goto("https://uk.webuy.com/", wait_until="domcontentloaded")
        
        # Test executing Algolia search query from within the page
        result = await page.evaluate("""async () => {
            const url = 'https://search.webuy.io/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(5.52.1)%3B%20Search%20(5.52.1)%3B%20Browser&x-algolia-api-key=bf79f2b6699e60a18ae330a1248b452c&x-algolia-application-id=LNNFEEWZVA';
            const payload = {
                requests: [
                    {
                        indexName: 'prod_cex_uk',
                        params: 'query=&facetFilters=%5B%22categoryFriendlyName%3Aplaystation5-software%22%5D&hitsPerPage=50&page=0'
                    }
                ]
            };
            const r = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await r.json();
        }""")
        
        boxes = result.get('results', [{}])[0].get('hits', [])
        total = result.get('results', [{}])[0].get('nbHits', 0)
        print(f"SUCCESS! Total PS5 games: {total}, fetched {len(boxes)} items!")
        for b in boxes[:5]:
            print(f"- [{b.get('boxId')}] {b.get('boxName')} | £{b.get('sellPrice')} | Cash: £{b.get('cashPrice')} | OutOfStock: {b.get('outOfStock')}")
            print(f"  Image: {b.get('imageUrls', {}).get('large')}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
