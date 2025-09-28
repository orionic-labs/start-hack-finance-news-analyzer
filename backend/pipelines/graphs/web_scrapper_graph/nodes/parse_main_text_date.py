import os
import json
from typing import Dict, Any

import base64

from langchain_openai import ChatOpenAI

from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from backend.pipelines.graphs.web_scrapper_graph.state import InitState, OverallState, SubState

from dotenv import load_dotenv

from backend.utils.helpers import extract_text_inside_tags

import asyncio
import base64
import io
import json
from bs4 import BeautifulSoup
import time

from backend.pipelines.graphs.web_scrapper_graph.state import InitState, OverallState

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig
from langchain_openai import ChatOpenAI
from PIL import Image
import re

load_dotenv()

# Maximum number of attempts to get a valid response
MAX_ATTEMPTS = 3

# System prompt as a separate constant
SYSTEM_PROMPT = """
IMPORTANT: user input will be provided as fully parsed content from a news article page!

You are an AI assistant specializing in extracting structured article data from raw parsed text.
Your task is to output a clean dictionary representing one news article.

Required Output Format:
<answer>
{{
  "url": "...",
  "image_url": "...",
  "provider": "...",
  "title": "...",
  "date": "...",
  "main_text": "..."
}}
</answer>

Instructions:
1. Carefully analyze the provided parsed text.
2. Extract the following fields:
   - url: direct link to the news article page
   - image_url: direct link to the article’s image
   - provider: the name of the website/news agency that published the article (e.g., Reuters, BBC, CNN)
   - title: the main headline of the article
   - date: the publication date of the article (clean and normalized)
   - main_text: the full article text, without ads, disclaimers, navigation elements, or unrelated content, but also DO NOT change anything in the news
3. Clean the extracted text:
   - Remove extra whitespace, line breaks, or irrelevant markup
   - Exclude cookie banners, disclaimers, or unrelated site text
   - Ensure main_text is coherent, continuous, and human-readable
   - Ensure provider is just the clean name (e.g., "Reuters"), not a URL
4. If any required field cannot be confidently extracted, omit it entirely (do not include with empty string).
5. DO NOT INCLUDE ANY ADDITIONAL COMMENTS.

Example:
<answer>
{{
  "url": "https://www.reuters.com/world/example-article",
  "image_url": "https://www.reuters.com/images/example.jpg",
  "provider": "Reuters",
  "title": "Cyberattack Disrupts European Airports",
  "date": "September 20, 2025",
  "main_text": "A major cyberattack has caused flight delays and cancellations at several European airports, including Heathrow and Brussels. Officials said ..."
}}
</answer>
"""

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
                    WAIT 5
                    IF (EXISTS `#onetrust-accept-btn-handler`) THEN CLICK `#onetrust-accept-btn-handler`
                    WAIT 3
                """
        run_cfg = CrawlerRunConfig(c4a_script=script, exclude_external_links=True)
        result = await crawler.arun(url=link, config=run_cfg)
        return result.markdown


def parsed_struct_text(state: SubState) -> OverallState:
    model = ChatOpenAI(model="gpt-4o")
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            # article_parsed = asyncio.run(get_news_text(state["article"]["link"]))
            # state["article"]["main_text"] = article_parsed
            article_text = (
                state["article"]
                if isinstance(state["article"], str)
                else json.dumps(state["article"], ensure_ascii=False)
            )
            message = HumanMessage(content=article_text)

            # Create message and prompt chain
            assistant_prompt = ChatPromptTemplate.from_messages([
                ('system', SYSTEM_PROMPT),
                message
            ])

            # Invoke the model
            assistant_chain = assistant_prompt | model
            raw_response = assistant_chain.invoke({})

            # Extract hypothesis and validate
            answer = extract_text_inside_tags(raw_response.content, "answer")
            if not answer or len(answer.strip()) == 0:
                raise ValueError("Answer is missing or empty.")

            try:
                answer_dict = json.loads(answer)
            except json.JSONDecodeError as je:
                raise ValueError(f"Failed to parse JSON from answer: {je}")
            result_state = {
                "new_articles": [answer_dict],
            }

            return result_state

        except ValueError as e:
            print(f"Attempt {attempt}/{MAX_ATTEMPTS} in parsed_struct_text failed: {e}")
            if attempt == MAX_ATTEMPTS:
                raise
        except Exception as e:
            print(f"Attempt {attempt}/{MAX_ATTEMPTS} in parsed_struct_text failed: {e}")
            if attempt == MAX_ATTEMPTS:
                raise
