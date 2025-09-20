from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

from datetime import datetime, date
from typing import Optional, Any, Dict
from urllib.parse import urlparse

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from simhash import Simhash


class ArticleNormalizationEntry(BaseModel):
    title: str = Field(None, description="Exact article headline")
    summary: str = Field(None, description="2-4 sentence neutral summary")
    published_at: date = Field(None, description="Publication date (YYYY-MM-DD)")
    lang: Optional[str] = Field(
        None, description="Two-letter uppercase ISO 639-1 code (e.g., EN, DE)"
    )


class ArticleEntry(ArticleNormalizationEntry):
    url: str
    source_domain: str
    fetched_at: datetime
    hash_64: int


_model = ChatOpenAI(model="gpt-4o", temperature=0, max_retries=2)

_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
Given an unstructured article body, return a SINGLE JSON object with EXACTLY these keys:
  - "title": exact headline as printed in the article
  - "summary": objective summary of the article, no quotes, links, or HTML; include key numbers, entities, and dates
  - "published_at": publication date in YYYY-MM-DD, or null if unknown
  - "lang": two-letter UPPERCASE ISO 639-1 code (EN, DE, FR, etc.), or null if uncertain

Strict rules:
- Do not include any extra keys or comments.
- "title": keep source capitalization; strip surrounding quotes; trim whitespace.
- "summary": neutral tone; no speculation;
- "published_at": prefer explicit on-page date; if multiple dates appear, pick the earliest one clearly marked as publication/release date. If only relative phrases (e.g., "today"), use null.
- "lang": infer from the article body; output two-letter uppercase code; if unsure, null.

Return only the JSON object.
Article:
{article}
        """.strip(),
        )
    ]
)

_chain = _prompt | _model.with_structured_output(ArticleNormalizationEntry)


def normalize_article(state: Dict[str, Any]) -> Dict[str, Any]:
    url: str = state["url"]
    article_text: str = state["unstructured_article"]

    norm = _chain.invoke({"article": article_text})

    netloc = urlparse(url).netloc.lower()
    source_domain = netloc[4:] if netloc.startswith("www.") else netloc
    fetched_at = datetime.now()
    hash_64 = Simhash(f"{norm.title or ''} || {norm.summary or ''}").value

    entry = ArticleEntry(
        url=url,
        source_domain=source_domain,
        fetched_at=fetched_at,
        hash_64=hash_64,
        title=norm.title,
        summary=norm.summary,
        published_at=norm.published_at,
        lang=norm.lang,
    )

    state["article_row"] = entry.model_dump()
    return state
