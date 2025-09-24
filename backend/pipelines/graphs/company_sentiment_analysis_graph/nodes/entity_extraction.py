import os
import json
from typing import Dict, Any

import base64

from langchain_openai import ChatOpenAI

from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from dotenv import load_dotenv

from backend.utils.helpers import extract_text_inside_tags

import asyncio
import base64
import io
import json


from backend.pipelines.graphs.company_sentiment_analysis_graph.state import InputState, OverallState

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig
from langchain_openai import ChatOpenAI
from PIL import Image
import re

load_dotenv()

# Maximum number of attempts to get a valid response
MAX_ATTEMPTS = 3

# System prompt as a separate constant
SYSTEM_PROMPT = """
You are an expert financial analyst. Your task is to extract all portfolio-relevant entities from the provided news articles with extreme precision.

Return ONLY a single JSON list.
Each element of the list must be a dictionary with the following keys:

- **entity**: One of the FIXED keys from this list only:
  ["fx_usd", "fx_chf", "fx_eur", "fx_jpy", "gold", "global_gov_bonds", "global_corp_bonds", "usa_equities", "emerging_markets", "eu_equities", "japan_equities"].
- **context**: A short description (1–2 sentences) of how this entity is relevant in the article.  
  The context should summarize the article fragment, not just repeat a raw sentence.  
  Mention company names, indices, or assets as they appear, but connect them explicitly to the portfolio entity.

**Extraction Rules:**
- You MUST choose entity strictly from the fixed list above. No other values are allowed.
- Map individual companies, indices, or assets to the correct portfolio bucket:
  - U.S. companies/indices → "usa_equities"
  - European companies/indices → "eu_equities"
  - Japanese companies/indices → "japan_equities"
  - References to USD → "fx_usd"
  - References to EUR → "fx_eur"
  - References to JPY → "fx_jpy"
  - References to CHF → "fx_chf"
  - References to gold → "gold"
  - Mentions of global bonds (yields, Treasuries, Bunds, JGBs, etc.) → "global_gov_bonds"
  - Mentions of corporate bonds/credit spreads → "global_corp_bonds"
  - Mentions of developing countries or EM stocks/currencies → "emerging_markets"
  
- If the article has no relation to any of the listed entities, return [].
- Do not include people.
- Do not invent entities.

DO NOT INCLUDE ANY ADDITIONAL COMMENTS.
Wrap your JSON output inside <answer> ... </answer> tags.

Example:
<answer>
[
  {{
    "entity": "usa_equities",
    "context": "NVIDIA shares surged after strong earnings, highlighting positive momentum in U.S. technology equities."
  }},
  {{
    "entity": "fx_usd",
    "context": "The Federal Reserve’s rate cut weighed on the U.S. dollar, affecting foreign exchange markets."
  }}
]
</answer>
"""


def entity_extraction(state: InputState) -> OverallState:
    model = ChatOpenAI(model="gpt-4o")
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            # article_parsed = asyncio.run(get_news_text(state["article"]["link"]))
            # state["article"]["main_text"] = article_parsed
            article_text = (
                state["unstructured_article"]
                if isinstance(state["unstructured_article"], str)
                else json.dumps(state["unstructured_article"], ensure_ascii=False)
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
                return {}

            try:
                answer_dict = json.loads(answer)
            except json.JSONDecodeError as je:
                raise ValueError(f"Failed to parse JSON from answer: {je}")

            else:
                result_state = {
                    "entities_news": answer_dict,
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
