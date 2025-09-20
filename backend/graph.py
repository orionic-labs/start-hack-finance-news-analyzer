# graph.py
from __future__ import annotations
from typing import TypedDict, Dict, Any

from langgraph.graph import StateGraph, START, END
from normalize_article import normalize_article


class GraphState(TypedDict, total=False):
    url: str
    unstructured_article: str
    article_row: Dict[str, Any]


graph_builder = StateGraph(GraphState)
graph_builder.add_node("normalize_article", normalize_article)
graph_builder.add_edge(START, "normalize_article")
graph_builder.add_edge("normalize_article", END)
graph = graph_builder.compile()
