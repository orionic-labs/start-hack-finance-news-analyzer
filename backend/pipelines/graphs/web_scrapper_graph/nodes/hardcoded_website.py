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

def parse_reuters_news(md: str):
    articles = []

    # Разбиваем по картинкам (каждая новость начинается с ![...](img))
    blocks = re.split(r"!\[.*?\]\((https://[^\)]+)\)", md)

    for i in range(1, len(blocks), 2):
        image_url = blocks[i]
        block_text = blocks[i+1] if i+1 < len(blocks) else ""

        # title + link (берем первый непустой линк на reuters)
        m = re.search(r"\[([^\]]+?)\]\((https://www\.reuters\.com[^\)]+)\)", block_text)
        if not m:
            continue
        title, link = m.groups()

        # если "category" в title → это не заголовок, ищем следующий
        if "category" in title.lower() or not title.strip():
            m2 = re.search(r"\[([^\]]+?)\]\((https://www\.reuters\.com[^\)]+)\)", block_text[m.end():])
            if m2:
                title, link = m2.groups()

        # date (ищем строку после заголовка)
        date_match = re.search(
            r"([A-Z][a-z]+ \d{1,2}, \d{4}(?: · \d{1,2}:\d{2} [AP]M GMT\+\d+)?)",
            block_text
        )
        date = date_match.group(1) if date_match else None

        articles.append({
            "title": title.strip(),
            "link": link.strip(),
            "image": image_url.strip(),
            "date": date
        })

    return articles

def parse_reuters_markdown(md: str):
    news = []
    # Находим блоки: сначала картинка (![](...)), потом ссылка с заголовком ([Title](...))
    pattern = re.compile(
        r"!\[.*?\]\((https://[^\)]+)\)\s*### \[(.+?)\]\((https://www\.reuters\.com[^\)]+)\)",
        re.DOTALL
    )
    for match in pattern.finditer(md):
        image_url, title, url = match.groups()
        news.append({
            "title": title.strip(),
            "url": url.strip(),
            "image": image_url.strip()
        })
    return news

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
        articles = parse_reuters_news(result.markdown)
        articles = articles[:3]
        return articles





def get_posts_hardcoded(state: InitState) -> OverallState:
    result = asyncio.run(main(state))
    return {"articles": result, "article_index": 0}

