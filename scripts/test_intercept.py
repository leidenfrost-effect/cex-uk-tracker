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
        
        captured_data = []
        
        # Intercept network responses
        page.on("response", lambda response: asyncio.create_task(handle_response(response, captured_data)))
        
        print("Opening CeX UK search page...")
        await page.goto("https://uk.webuy.com/search?categoryFriendlyName=playstation5-software", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        
        print(f"Total API responses captured: {len(captured_data)}")
        for item in captured_data[:3]:
            print(f"URL: {item['url']}")
            print("Snippet:", str(item['data'])[:200])
            
        await browser.close()

async def handle_response(response, captured_data):
    url = response.url
    if "boxes" in url or "search" in url or "products" in url or "category" in url:
        try:
            if "application/json" in response.headers.get("content-type", ""):
                data = await response.json()
                captured_data.append({"url": url, "data": data})
                print(f"[CAPTURED JSON] {url}")
        except:
            pass

if __name__ == "__main__":
    asyncio.run(main())
