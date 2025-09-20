from langgraph.types import Send

from dotenv import load_dotenv
from backend.pipelines.graphs.web_scrapper_graph.state import InitState, OverallState
from backend.pipelines.graphs.ingest_graph.state import GraphState

import asyncio

from backend.pipelines.graphs.web_scrapper_graph.state import InitState, OverallState

load_dotenv()


def send_unstructured_articles(state: OverallState):
    sends = []
    for a in state["new_articles"]:
        sends.append(Send("Analyse Posts", {"url": a["url"], "title": a["title"],
                                            "unstructured_article": a["main_text"], "raw": a["main_text"], "provider": a["provider"]}))

    return sends
