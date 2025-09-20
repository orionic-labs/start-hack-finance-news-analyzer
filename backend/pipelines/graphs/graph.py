from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import START, END
from langgraph.graph import StateGraph
from backend.pipelines.graphs.ingest_graph.ingest_graph import graph as ingest_graph
from backend.pipelines.graphs.web_scrapper_graph.graph import graph as scrapper_graph
from backend.pipelines.graphs.web_scrapper_graph.state import InitState, OverallState, OutputState
from backend.pipelines.graphs.ingest_graph.state import GraphState
from backend.pipelines.graphs.send_unstructured_articles import send_unstructured_articles

import json

from backend.pipelines.graphs.web_scrapper_graph.nodes.hardcoded_website import get_posts_hardcoded
from backend.pipelines.graphs.web_scrapper_graph.nodes.send_articles import send_article

builder = StateGraph(OverallState,
                     input=InitState,
                     output=OutputState
                     )

def end_of_graph(state: OutputState):
    return state

builder.add_node("Scrap Posts", scrapper_graph)
builder.add_node("Analyse Posts", ingest_graph)
builder.add_node("End of graph", end_of_graph)


builder.add_edge(START, "Scrap Posts")
builder.add_conditional_edges("Scrap Posts", send_unstructured_articles, ["Analyse Posts"])
builder.add_edge("Analyse Posts", "End of graph")
builder.add_edge("End of graph", END)

graph = builder.compile()
graph.invoke({"link": "https://www.reuters.com/world/"})

