from langgraph.types import Send


from dotenv import load_dotenv


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

load_dotenv()

COOKIES_FILE = "cookies.json"


async def load_cookies():
    try:
        with open(COOKIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print("No cookies.json found, running without cookies")
        return None


async def get_news_text(link):
    cookies = await load_cookies()
    browser_cfg = BrowserConfig(headless=True, user_agent=(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " "AppleWebKit/537.36 (KHTML, like Gecko) " "Chrome/120.0 Safari/537.36"),
                                cookies=cookies)

    async with AsyncWebCrawler(config=browser_cfg) as crawler:
        script = """
                WAIT 10
                IF (EXISTS `#onetrust-accept-btn-handler`) THEN CLICK `#onetrust-accept-btn-handler`
                IF (EXISTS `button:has-text("Alle akzeptieren")`) THEN CLICK `button:has-text("Alle akzeptieren")`
                WAIT 5

                """
        run_cfg = CrawlerRunConfig(c4a_script=script, exclude_external_links=True)
        result = await crawler.arun(url=link, config=run_cfg)
        return result.markdown

def send_article(state: OverallState):
    sends = []
    for a in state["articles"]:
        article_parsed = asyncio.run(get_news_text(a["link"]))
        a["main_text"] = article_parsed
        sends.append(Send("Parse Structured Post", {"article": a}))

    return sends