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
        
        async def handle_request(request):
            if "search.webuy.io" in request.url:
                print("\n[REQUEST URL]:", request.url)
                print("[REQUEST POST DATA]:", request.post_data)
                
        async def handle_response(response):
            if "search.webuy.io" in response.url:
                try:
                    data = await response.json()
                    hits = data.get("results", [{}])[0].get("hits", [])
                    total = data.get("results", [{}])[0].get("nbHits", 0)
                    print(f"\n[RESPONSE] Total: {total}, Hits: {len(hits)}")
                    if hits:
                        print(f"Sample hit 1: {hits[0].get('boxName')} | £{hits[0].get('sellPrice')}")
                except Exception as e:
                    print("Response err:", e)
                    
        page.on("request", handle_request)
        page.on("response", handle_response)
        
        print("Navigating to PS5 software...")
        await page.goto("https://uk.webuy.com/search?categoryFriendlyName=playstation5-software", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        
        print("\nNavigating to Xbox 360 software...")
        await page.goto("https://uk.webuy.com/search?categoryFriendlyName=xbox-360-software", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
