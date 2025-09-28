import json
import re
from bs4 import BeautifulSoup
import feedparser

from backend.pipelines.graphs.web_scrapper_graph.state import InitState, OverallState


def parse_yahoo_finance_news(html_content: str):
    articles = []
    soup = BeautifulSoup(html_content, 'html.parser')

    news_items = soup.find_all('div', {'data-module': 'NewsStream'}) or soup.find_all('li', class_='js-stream-content')

    if not news_items:
        news_items = soup.find_all('div', class_=re.compile(r'(story|article|news)'))[:5]

    for item in news_items[:3]:
        try:
            title_elem = (
                item.find('h3') or
                item.find('h2') or
                item.find('a', class_=re.compile(r'title|headline')) or
                item.find('span', class_=re.compile(r'title|headline'))
            )

            if not title_elem:
                continue

            title = title_elem.get_text(strip=True)

            link_elem = item.find('a', href=True)
            if not link_elem:
                continue

            link = link_elem['href']
            if link.startswith('/'):
                link = 'https://finance.yahoo.com' + link
            elif not link.startswith('http'):
                link = 'https://finance.yahoo.com/' + link

            img_elem = (
                item.find('img') or
                item.find('div', class_=re.compile(r'image|photo|thumb'))
            )
            image_url = None
            if img_elem:
                if img_elem.name == 'img':
                    image_url = img_elem.get('src') or img_elem.get('data-src')
                else:
                    img_tag = img_elem.find('img')
                    if img_tag:
                        image_url = img_tag.get('src') or img_tag.get('data-src')

            date_elem = item.find('time') or item.find('span', class_=re.compile(r'date|time'))
            date = date_elem.get_text(strip=True) if date_elem else None

            if title and link:
                articles.append({
                    "title": title.strip(),
                    "link": link.strip(),
                    "image": image_url.strip() if image_url else None,
                    "date": date
                })

        except Exception as e:
            print(f"Error parsing Yahoo Finance article: {e}")
            continue

    return articles


def parse_yahoo_finance_markdown(md: str):
    articles = []

    link_pattern = re.compile(r'\[([^\]]+)\]\((https://[^\)]+)\)')
    matches = link_pattern.findall(md)

    for title, url in matches[:3]:
        if any(skip in url.lower() for skip in ['video', 'podcast', 'advertisement', 'subscribe']):
            continue

        articles.append({
            "title": title.strip(),
            "link": url.strip(),
            "image": None,
            "date": None
        })

    return articles

def scrape_yahoo_finance_rss() -> list:
    """Scrape Yahoo Finance using RSS feed - much more reliable than browser scraping"""
    try:
        # RSS feed URL
        rss_url = "https://finance.yahoo.com/news/rssindex"

        feed = feedparser.parse(rss_url)
        articles = []

        for entry in feed.entries[2:10]:
            title = entry.title
            link = entry.link

            image_url = None
            if hasattr(entry, 'media_content') and entry.media_content:
                image_url = entry.media_content[0].get('url')
            elif hasattr(entry, 'enclosures') and entry.enclosures:
                image_url = entry.enclosures[0].href

            date = entry.published if hasattr(entry, 'published') else None

            articles.append({
                "title": title.strip(),
                "link": link.strip(),
                "image": image_url,
                "date": date
            })

        print(f"Yahoo Finance RSS: Found {len(articles)} articles")
        return articles

    except Exception as e:
        print(f"Error scraping Yahoo Finance RSS: {e}")
        return []



def get_posts_hardcoded_yahoo(state: InitState) -> OverallState:
    print("Yahoo Finance: Using RSS feed instead of website scraping")
    result = scrape_yahoo_finance_rss()

    return {
        "link": "https://finance.yahoo.com/news/rssindex",
        "articles": result,
        "new_articles": [],
        "screenshot": "",
        "parsed_website": "yahoo_finance_rss",
        "article_index": 0
    }
