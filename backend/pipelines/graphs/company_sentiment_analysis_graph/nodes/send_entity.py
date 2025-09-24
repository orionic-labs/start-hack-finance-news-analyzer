from langgraph.types import Send

from dotenv import load_dotenv
from backend.pipelines.graphs.company_sentiment_analysis_graph.state import SubState, OverallState

import asyncio


load_dotenv()



def send_entity(state: OverallState):
    sends = []
    for a in state["entities_news"]:
        sends.append(Send("Entity Sentiment Analysis", {"entity": a["entity"], "text": a["context"], "insert_article_id": state["insert_article_id"]}))

    return sends