from __future__ import annotations

from utils.helpers import utcnow
from datetime import date, datetime
from typing import Optional, Any, Dict, List
from urllib.parse import urlparse

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from services.dedup import simhash64, to_signed_64
from services.embeddings import embed_text

load_dotenv()


class ArticleNormalizationEntry(BaseModel):
    title: str = Field(None, description="Exact article headline")
    summary: str = Field(None, description="2-4 sentence neutral summary")
    published_at: date = Field(None, description="YYYY-MM-DD")
    lang: Optional[str] = Field(None, description="Two-letter uppercase ISO 639-1")


class ArticleEntry(ArticleNormalizationEntry):
    url: str
    source_domain: str
    fetched_at: datetime
    hash_64: int
    content_emb: Optional[List[float]] = None


_model = ChatOpenAI(model="gpt-4o", temperature=0, max_retries=2)

_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an information-extraction engine for financial/news content.
Given an unstructured article body, return a SINGLE JSON object with EXACTLY these keys:
  - "title": exact headline
  - "summary": 2-4 sentences, objective, no quotes/links/HTML; include key numbers, entities, dates
  - "published_at": YYYY-MM-DD
  - "lang": two-letter UPPERCASE ISO 639-1 or null
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

    # 1) LLM normalization (title, summary, published_at, lang)
    norm = _chain.invoke({"article": article_text})

    # 2) Derived fields
    host = urlparse(url).netloc.lower()
    source_domain = host[4:] if host.startswith("www.") else host
    fetched_at = utcnow()
    raw_hash = simhash64(f"{norm.title or ''} || {norm.summary or ''}")
    hash_64 = to_signed_64(raw_hash)

    # 3) Embedding from title + summary
    combined_text = f"{norm.title or ''}\n\n{norm.summary or ''}"
    content_emb = embed_text(combined_text) if (norm.title or norm.summary) else None

    # 4) Final entry
    entry = ArticleEntry(
        url=url,
        source_domain=source_domain,
        fetched_at=fetched_at,
        hash_64=hash_64,
        content_emb=content_emb,
        title=norm.title,
        summary=norm.summary,
        published_at=norm.published_at,
        lang=norm.lang,
    )

    state["article_row"] = entry.model_dump()
    return state
