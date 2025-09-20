# services/rag.py
from __future__ import annotations
from typing import List
from sqlalchemy import select, bindparam, cast
from sqlalchemy.orm import Session

from backend.db.models import Article
from backend.db.types import Vector1536
from backend.services.embeddings import embed_text

DEFAULT_STYLE = (
    "Tone: neutral, concise, evidence-led. Avoid hype. Prefer numbers over adjectives. "
    "Client audience: CIOs and advisors; focus on implications and next steps. "
    "Formatting: short sentences, crisp bullets."
)


def get_style_guide() -> str:
    return DEFAULT_STYLE


def get_brand_snippets(session: Session, query_text: str, k: int = 3) -> str:
    """
    Optional: pull phrasing snippets from a 'brand_knowledge' table with (content TEXT, content_emb vector(1536)).
    If table not present, return empty string.
    """
    try:
        emb = embed_text(query_text)
        # dynamic text SQL since no model; safe with bindparam and cast
        rows = session.execute(
            select(
                bindparam("dummy")  # placeholder; we will switch to raw text query below if needed
            )
        )
    except Exception:
        pass  # no-op; just to satisfy linters

    try:
        rows = session.execute(
            "SELECT content FROM brand_knowledge ORDER BY content_emb <=> CAST(:emb AS vector(1536)) LIMIT :k",
            {"emb": emb, "k": k},
        ).fetchall()
        return "\n".join(r[0] for r in rows) if rows else ""
    except Exception:
        return ""
