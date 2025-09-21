from __future__ import annotations

from datetime import timedelta
from typing import Optional, Tuple, Union

from sqlalchemy import select, desc, bindparam, cast, literal
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from backend.db.session import AsyncSessionLocal

from backend.db.session import SessionLocal
from backend.db.models import Article
from backend.db.types import Vector1536
from backend.services.dedup import hamming_distance
from backend.services.embeddings import embed_text
from backend.utils.helpers import utcnow, to_int

HAMMING_THRESHOLD = 3
EMBED_SIM_THRESHOLD = 0.92
LOOKBACK_DAYS = 7
MAX_CANDIDATES = 2000
TOPK_EMB = 10


async def _fetch_recent_hashes(session: Session):
    cutoff = utcnow() - timedelta(days=LOOKBACK_DAYS)
    stmt = (
        select(Article.url, Article.hash_64)
        .where(Article.fetched_at >= cutoff, Article.hash_64.isnot(None))
        .order_by(desc(Article.fetched_at))
        .limit(MAX_CANDIDATES)
    )
    result = await session.execute(stmt)
    return result.all()


async def _find_near_duplicate_simhash(
    session: Session, new_hash: int
) -> Optional[Tuple[str, int]]:
    for url, h in await _fetch_recent_hashes(session):
        existing = to_int(h)
        if existing is None:
            continue
        dist = hamming_distance(
            new_hash & 0xFFFFFFFFFFFFFFFF, existing & 0xFFFFFFFFFFFFFFFF
        )
        if dist <= HAMMING_THRESHOLD:
            return (url, dist)
    return None


async def _find_semantic_duplicate_db(
    session: Session, combined_text: str
) -> Optional[Tuple[str, float]]:
    emb = embed_text(combined_text)
    cutoff = utcnow() - timedelta(days=LOOKBACK_DAYS)

    distance = Article.content_emb.op("<=>")(cast(bindparam("emb"), Vector1536()))
    # FIX: Use literal(1) to prevent SQLAlchemy from applying the vector's
    # bind processor to the integer, which caused the TypeError.
    similarity = (literal(1) - distance).label("similarity")

    stmt = (
        select(Article.url, similarity)
        .where(
            Article.content_emb.isnot(None),
            Article.fetched_at >= cutoff,
        )
        .order_by(distance)
        .limit(TOPK_EMB)
    )

    result = await session.execute(stmt, {"emb": emb})
    rows = result.fetchall()
    if not rows:
        return None
    best_url, best_sim = rows[0][0], float(rows[0][1])
    if best_sim >= EMBED_SIM_THRESHOLD:
        return (best_url, best_sim)
    return None


async def insert_article(
    article_row: dict,
) -> Tuple[str, Optional[str], Optional[Union[int, float]]]:
    """
    Returns: (status, ref_url, metric)
      status in {"inserted", "duplicate", "semantic-duplicate", "exists"}
      metric: hamming distance (int) or similarity (float)
    """
    async with AsyncSessionLocal() as session:
        try:
            # 1) SimHash near-dup
            new_hash = to_int(article_row.get("hash_64"))
            if new_hash is not None:
                hit = await _find_near_duplicate_simhash(session, new_hash)
                if hit:
                    dup_url, dist = hit
                    return ("duplicate", dup_url, dist)

            # 2) Semantic dup via embeddings
            combined = (
                f"{article_row.get('title') or ''}\n\n{article_row.get('summary') or ''}"
            )
            if combined.strip():
                sem = await _find_semantic_duplicate_db(session, combined)
                if sem:
                    dup_url, sim = sem
                    return ("semantic-duplicate", dup_url, sim)

                # 3) Store embedding if missing
                if "content_emb" not in article_row or article_row["content_emb"] is None:
                    article_row["content_emb"] = embed_text(combined)

            # 4) Insert (PK url prevents exact dup)
            await session.add(Article(**article_row))
            await session.commit()
            return ("inserted", None, None)

        except IntegrityError:
            await session.rollback()
            return ("exists", None, None)
