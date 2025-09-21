import asyncio
import base64
import io
import json
from bs4 import BeautifulSoup
import time
import re


from backend.pipelines.graphs.web_scrapper_graph.state import InitState, OverallState

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig
from langchain_openai import ChatOpenAI
from PIL import Image
import re

COOKIES_FILE = "cookies.json"

import re

def parse_ft_markets(md: str):
    articles = []
    seen = set()

    start = md.find("More Market")
    end = md.find("[Previous page")
    if start == -1 or end == -1:
        return []
    md = md[start:end]
    matches = re.finditer(r"\[([^\]]+)\]\((https://www\.ft\.com/content/[^\)]+)\)", md)

    for m in matches:
        title, url = m.groups()

        # фильтруем мусор
        if not title.strip():
            continue
        if any(x in title.lower() for x in [
            "subscribe", "sign in", "accessibility", "save", "premium content"
        ]):
            continue
        if url in seen:
            continue

        # ищем картинку рядом
        after_text = md[m.end(): m.end() + 500]
        img_match = re.search(r"!\[.*?\]\((https://www\.ft\.com/__origami/service/image[^\)]+)\)", after_text)
        image_url = img_match.group(1) if img_match else None

        articles.append({
            "title": title.strip(),
            "link": url.strip(),
            "image": image_url
        })
        seen.add(url)

    return articles


async def load_cookies():
    try:
        with open(COOKIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print("No cookies.json found, running without cookies")
        return None

async def main(state: InitState) -> OverallState:
    cookies = await load_cookies()
    browser_cfg = BrowserConfig(headless=False, user_agent=(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " "AppleWebKit/537.36 (KHTML, like Gecko) " "Chrome/120.0 Safari/537.36"),
                                cookies=cookies, viewport_width=1920, viewport_height=1080,)

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        script = """
            WAIT 10
            IF (EXISTS `#onetrust-accept-btn-handler`) THEN CLICK `#onetrust-accept-btn-handler`
            WAIT 5
            """
        run_cfg = CrawlerRunConfig(c4a_script=script, exclude_external_links=True)
        result = await crawler.arun(url=state["link"], config=run_cfg)
        print(result.markdown)
        articles = parse_ft_markets(result.markdown)
        articles = articles[:2]
        print(articles)
        return articles



def get_posts_hardcoded_ft(state: InitState) -> OverallState:
    result = asyncio.run(main(state))
    return {"articles": result, "article_index": 0}
