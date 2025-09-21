import asyncio
import json
from bs4 import BeautifulSoup
import feedparser
import requests

from backend.pipelines.graphs.web_scrapper_graph.state import InitState, OverallState

COOKIES_FILE = "cookies.json"


def get_cnbc_articles_with_images(state: InitState):
    feed = feedparser.parse(state["link"])
    articles = []

    for entry in feed.entries[:3]:
        title = entry.title
        link = entry.link

        try:
            resp = requests.get(link, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            og_img = soup.find("meta", property="og:image")
            image_url = og_img["content"] if og_img else None
        except Exception as e:
            print(f"Ошибка загрузки {link}: {e}")
            image_url = None

        articles.append({
            "title": title,
            "link": link,
            "image": image_url
        })

    return articles


async def load_cookies():
    try:
        with open(COOKIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print("No cookies.json found, running without cookies")
        return None


async def main(state: InitState) -> OverallState:
    # RSS не требует Selenium/Crawl4AI — просто сразу парсим
    articles = get_cnbc_articles_with_images(state)
    return articles


def get_posts_hardcoded_cnbc(state: InitState) -> OverallState:
    result = asyncio.run(main(state))
    return {"articles": result, "article_index": 0}


