# repositories/analysis.py
from __future__ import annotations
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text


def insert_analysis_packet(
    session: Session, article_url: str, packet: Dict[str, Any], cluster_urls: list[str]
) -> None:
    session.execute(
        text(
            """
            INSERT INTO article_analysis
              (article_url, cluster_ids, event_type, tickers, companies, sectors, geos, numerics,
               impact_score, confidence, novelty, executive_summary, bullets, actions, risks, citations)
            VALUES
              (:url, :cluster_ids, :event_type, :tickers, :companies, :sectors, :geos, :numerics,
               :impact_score, :confidence, :novelty, :executive_summary, :bullets, :actions, :risks, :citations)
            """
        ),
        {
            "url": article_url,
            "cluster_ids": cluster_urls,
            "event_type": packet["extracted"]["event_type"],
            "tickers": packet["extracted"]["tickers"],
            "companies": packet["extracted"]["companies"],
            "sectors": packet["extracted"]["sectors"],
            "geos": packet["extracted"]["geos"],
            "numerics": packet["extracted"]["numerics"],
            "impact_score": packet["impact"]["impact_score"],
            "confidence": packet["impact"]["confidence"],
            "novelty": packet["impact"]["novelty"],
            "executive_summary": packet["packet"]["executive_summary"],
            "bullets": packet["packet"]["bullets"],
            "actions": packet["packet"]["actions"],
            "risks": packet["packet"]["risks"],
            "citations": packet["packet"]["citations"],
        },
    )
