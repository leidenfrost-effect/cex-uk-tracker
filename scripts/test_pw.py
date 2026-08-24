import asyncio
import json
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        # Launch real browser
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        
        print("Navigating to CeX UK...")
        response = await page.goto("https://uk.webuy.com/search?categoryFriendlyName=playstation5-software", wait_until="domcontentloaded")
        print("Page response status:", response.status if response else "None")
        await page.wait_for_timeout(3000)
        
        # Test executing fetch from page context
        result = await page.evaluate("""async () => {
            try {
                const res = await fetch('https://wss2.cex.uk.webuy.io/v3/boxes?categoryFriendlyName=playstation5-software&firstRecord=1&count=20', {
                    headers: {
                        'Accept': 'application/json, text/plain, */*'
                    }
                });
                return await res.json();
            } catch(e) {
                return { error: e.toString() };
            }
        }""")
        
        print("Result from evaluate:", str(result)[:300])
        boxes = result.get('response', {}).get('data', {}).get('boxes', [])
        total = result.get('response', {}).get('data', {}).get('totalRecords', 0)
        print(f"Total PS5 games in CeX: {total}, fetched: {len(boxes)}")
        for b in boxes[:5]:
            print(f"- {b.get('boxName')} | £{b.get('sellPrice')} | ID: {b.get('boxId')}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
