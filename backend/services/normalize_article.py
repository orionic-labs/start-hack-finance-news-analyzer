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


# This model now ONLY defines what the LLM is expected to extract.
# Title is removed as it's passed in directly.
class ArticleNormalizationEntry(BaseModel):
    summary: str = Field(None, description="2-4 sentence neutral summary")
    published_at: date = Field(None, description="YYYY-MM-DD")
    lang: Optional[str] = Field(None, description="Two-letter uppercase ISO 639-1")


class ArticleEntry(ArticleNormalizationEntry):
    # The final, complete entry still includes the title.
    title: str
    url: str
    source_domain: str
    fetched_at: datetime
    hash_64: int
    content_emb: Optional[List[float]] = None


_model = ChatOpenAI(model="gpt-4o", temperature=0.1, max_retries=2)

_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a meticulous and highly efficient news pre-processing engine. Your sole purpose is to extract and summarize raw article text into a structured, consistent JSON format, ensuring no critical financial details are lost.

Given the unstructured article text, return a SINGLE JSON object with EXACTLY these keys.

**Extraction Rules:**
- **`summary`**: Create a comprehensive, factual summary. The goal is to capture **all potentially market-relevant information**. Your summary must include:
    - All specific companies, people, and locations mentioned.
    - All key financial figures, percentages, dates, and data points.
    - The primary event, its cause, and its stated outcomes or consequences.
    - Any forward-looking statements, guidance, or analyst expectations.
  The summary should be dense with facts, objective, and written in neutral language. Do not include opinions, quotes, or HTML tags.
- **`published_at`**: Find the primary publication date and format it as `YYYY-MM-DD`. If no date is clearly stated, return `null`.
- **`lang`**: Identify the language of the article and return its two-letter ISO 639-1 code in UPPERCASE (e.g., 'EN', 'DE', 'FR'). If the language is unclear, return `null`.

Your response MUST be ONLY the JSON object, with no other text, comments, or explanations.

Article to process:
{article}
""".strip(),
        )
    ]
)


_chain = _prompt | _model.with_structured_output(
    ArticleNormalizationEntry, method="function_calling"
)


def normalize_article(state: Dict[str, Any]) -> Dict[str, Any]:
    url: str = state["url"]
    title: str = state["title"]
    article_text: str = state["unstructured_article"]

    # 1) LLM normalization (summary, published_at, lang)
    norm = _chain.invoke({"article": article_text})

    # 2) Derived fields
    host = urlparse(url).netloc.lower()
    source_domain = host[4:] if host.startswith("www.") else host
    fetched_at = utcnow()
    raw_hash = simhash64(f"{title or ''} || {norm.summary or ''}")
    hash_64 = to_signed_64(raw_hash)

    # 3) Embedding from title + summary
    combined_text = f"{title or ''}\n\n{norm.summary or ''}"
    content_emb = embed_text(combined_text) if (title or norm.summary) else None

    # 4) Final entry
    entry = ArticleEntry(
        url=url,
        title=title,
        source_domain=source_domain,
        fetched_at=fetched_at,
        hash_64=hash_64,
        content_emb=content_emb,
        summary=norm.summary,
        published_at=norm.published_at,
        lang=norm.lang,
    )

    state["article_row"] = entry.model_dump()
    return state
