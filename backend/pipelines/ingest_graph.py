from __future__ import annotations
from typing import TypedDict, Dict, Any, List, Tuple

from langgraph.graph import StateGraph, START, END
from sqlalchemy import select, bindparam, cast
from sqlalchemy.orm import Session

from services.normalize_article import normalize_article
from repositories.articles import insert_article
from repositories.analysis import insert_analysis_packet
from services.news_analysis import analyze_news
from services.rag import get_style_guide, get_brand_snippets
from services.verify_output import verify_packet
from services.embeddings import embed_text
from db.session import SessionLocal
from db.models import Article
from db.types import Vector1536


class GraphState(TypedDict, total=False):
    url: str
    title: str  # <-- THIS IS THE FIX
    unstructured_article: str
    article_row: Dict[str, Any]
    insert_status: str
    insert_ref_url: str
    insert_metric: Any
    related_articles: List[Dict[str, Any]]
    analysis: Dict[str, Any]
    verified: bool
    verification_issues: List[str]
    alerted: bool


# --- Nodes ---


def node_insert(state: GraphState) -> GraphState:
    status, ref_url, metric = insert_article(state["article_row"])
    state["insert_status"] = status
    if ref_url:
        state["insert_ref_url"] = ref_url
    if metric is not None:
        state["insert_metric"] = metric
    return state


def route_after_insert(state: GraphState) -> str:
    # If near-duplicate by SimHash, skip analysis
    if state.get("insert_status") == "duplicate":
        return "skip"
    # For new insert or semantic-duplicate, we still analyze (useful to refresh packet)
    return "analyze"


def node_fetch_related(state: GraphState) -> GraphState:
    session: Session = SessionLocal()
    try:
        primary = session.get(Article, state["article_row"]["url"])
        if not primary:
            state["related_articles"] = []
            return state

        emb = primary.content_emb or embed_text(
            f"{primary.title or ''}\n\n{primary.summary or ''}"
        )
        dist = Article.content_emb.op("<=>")(cast(bindparam("emb"), Vector1536()))
        rows = session.execute(
            select(
                Article.url,
                Article.title,
                Article.summary,
                Article.published_at,
                Article.source_domain,
                Article.content_emb,
            )
            .where(Article.url != primary.url, Article.content_emb.isnot(None))
            .order_by(dist)
            .limit(5),
            {"emb": emb},
        ).fetchall()
        related = []
        for r in rows:
            related.append(
                {
                    "url": r[0],
                    "title": r[1],
                    "summary": r[2],
                    "published_at": r[3],
                    "source_domain": r[4],
                    "content_emb": r[5],
                }
            )
        state["related_articles"] = related
        return state
    finally:
        session.close()


def node_analyze(state: GraphState) -> GraphState:
    session: Session = SessionLocal()
    try:
        # Style and brand snippets (RAG)
        style = get_style_guide()
        qtext = f"{state['article_row'].get('title','')} {state['article_row'].get('summary','')}"
        rag = get_brand_snippets(session, qtext, k=3)

        # Build primary dict from DB row for consistency
        pr = session.get(Article, state["article_row"]["url"])
        primary = {
            "url": pr.url,
            "title": pr.title,
            "summary": pr.summary,
            "published_at": pr.published_at,
            "source_domain": pr.source_domain,
        }

        analysis_obj = analyze_news(
            primary, state.get("related_articles", []), style, rag
        )
        state["analysis"] = analysis_obj.model_dump()
        return state
    finally:
        session.close()


def node_verify_and_persist(state: GraphState) -> GraphState:
    # Build sources text for verification
    parts = []
    parts.append(
        f"{state['article_row'].get('title','')} :: {state['article_row'].get('summary','')}"
    )
    for r in state.get("related_articles", []):
        parts.append(f"{r.get('title','')} :: {r.get('summary','')}")
    sources_text = "\n\n".join(parts)

    ver = verify_packet(sources_text, state["analysis"])
    state["verified"] = ver.ok
    state["verification_issues"] = ver.issues

    # Persist packet
    session: Session = SessionLocal()
    try:
        cluster_urls = [x["url"] for x in state.get("related_articles", [])]
        insert_analysis_packet(
            session, state["article_row"]["url"], state["analysis"], cluster_urls
        )
        session.commit()
    finally:
        session.close()

    return state


# --- Build graph ---
graph_builder = StateGraph(GraphState)

graph_builder.add_node("normalize_article", normalize_article)
graph_builder.add_node("insert", node_insert)
graph_builder.add_node("fetch_related", node_fetch_related)
graph_builder.add_node("analyze", node_analyze)
graph_builder.add_node("verify_and_persist", node_verify_and_persist)

graph_builder.add_edge(START, "normalize_article")
graph_builder.add_edge("normalize_article", "insert")
graph_builder.add_conditional_edges(
    "insert", route_after_insert, {"skip": END, "analyze": "fetch_related"}
)
graph_builder.add_edge("fetch_related", "analyze")
graph_builder.add_edge("analyze", "verify_and_persist")
graph_builder.add_edge("verify_and_persist", END)

graph = graph_builder.compile()
