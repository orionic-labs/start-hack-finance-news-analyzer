from __future__ import annotations
from typing import TypedDict, Dict, Any, List, Tuple


class GraphState(TypedDict):
    url: str
    image_url: str
    title: str  # <-- THIS IS THE FIX
    raw: str
    unstructured_article: str
    article_row: Dict[str, Any]
    insert_status: str
    insert_ref_url: str
    insert_article_id: int
    insert_metric: Any
    related_articles: List[Dict[str, Any]]
    analysis: Dict[str, Any]
    verified: bool
    verification_issues: List[str]
    alerted: bool
    provider: str
