from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import START, END
from langgraph.graph import StateGraph
from backend.pipelines.graphs.company_sentiment_analysis_graph.state import InputState, OverallState
from backend.db.session import AsyncSessionLocal
from backend.db.models import EntitySentiment, Assets
import asyncio


from backend.pipelines.graphs.company_sentiment_analysis_graph.nodes.entity_extraction import entity_extraction
from backend.pipelines.graphs.company_sentiment_analysis_graph.nodes.send_entity import send_entity
from backend.pipelines.graphs.company_sentiment_analysis_graph.nodes.entity_sentiment_analysis import entity_sentiment_analysis


async def get_asset_id_by_name(asset_name: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            Assets.__table__.select().where(Assets.asset_name == asset_name)
        )
        asset = result.fetchone()
        if not asset:
            raise ValueError(f"Asset '{asset_name}' not found in DB")
        return asset.id


async def save_entity_sentiment(article_id: int, asset_name: str, label: str, score: float):
    async with AsyncSessionLocal() as session:
        asset_id = await get_asset_id_by_name(asset_name)
        sentiment = EntitySentiment(
            article_id=article_id,
            asset_id=asset_id,
            label=label,
            score=score
        )
        session.add(sentiment)
        await session.commit()


async def save_all_entity(state: OverallState):
    for a in state["entities_sentiment"]:
        await save_entity_sentiment(state["insert_article_id"], a["entity"], a["label"], a["score"])
    return {}



builder = StateGraph(OverallState,
                     input=InputState,
                     output=OverallState
                     )

builder.add_node("Entity Extraction", entity_extraction)
builder.add_node("Entity Sentiment Analysis", entity_sentiment_analysis)
builder.add_node("Save Sentiment Analysis Results", save_all_entity)


builder.add_edge(START, "Entity Extraction")
builder.add_conditional_edges("Entity Extraction", send_entity, ["Entity Sentiment Analysis"])
builder.add_edge("Entity Sentiment Analysis", "Save Sentiment Analysis Results")
builder.add_edge("Save Sentiment Analysis Results", END)

graph = builder.compile()


async def run():
    print(await graph.ainvoke({
    "unstructured_article":
        """
USA Equities go up
Europe Equities go down
"""
}))

if __name__ == "__main__":
    asyncio.run(run())