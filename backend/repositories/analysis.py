# repositories/analysis.py
from __future__ import annotations
import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text


async def insert_analysis_packet(
    session: Session, article_url: str, packet: Dict[str, Any], cluster_urls: list[str]
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO article_analysis
              (article_url, cluster_ids, event_type, tickers, companies, sectors, geos, numerics,
               impact_score, confidence, novelty, executive_summary, bullets, actions, risks, citations, important, markets)
            VALUES
              (:url, :cluster_ids, :event_type, :tickers, :companies, :sectors, :geos, :numerics,
               :impact_score, :confidence, :novelty, :executive_summary, :bullets, :actions, :risks, :citations, :important, :markets)
            """
        ),
        {
            "url": article_url,
            # These are TEXT[] (array) columns, so we pass the Python lists directly.
            "cluster_ids": cluster_urls,
            "tickers": packet["extracted"]["tickers"],
            "companies": packet["extracted"]["companies"],
            "sectors": packet["extracted"]["sectors"],
            "geos": packet["extracted"]["geos"],
            "markets": packet["extracted"]["markets"],
            # These are JSONB columns, so we must serialize them to JSON strings.
            "numerics": json.dumps(packet["extracted"]["numerics"]),
            "bullets": json.dumps(packet["packet"]["bullets"]),
            "actions": json.dumps(packet["packet"]["actions"]),
            "risks": json.dumps(packet["packet"]["risks"]),
            "citations": json.dumps(packet["packet"]["citations"]),
            # These are standard types.
            "event_type": packet["extracted"]["event_type"],
            "impact_score": packet["impact"]["impact_score"],
            "confidence": packet["impact"]["confidence"],
            "novelty": packet["impact"]["novelty"],
            "executive_summary": packet["packet"]["executive_summary"],
            # These are boolean
            "important": packet["importance"]["importance"],
        },
    )
