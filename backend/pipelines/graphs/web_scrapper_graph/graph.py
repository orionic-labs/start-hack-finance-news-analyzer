from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import START, END
from langgraph.graph import StateGraph
from backend.pipelines.graphs.web_scrapper_graph.state import InitState, OverallState
from backend.pipelines.graphs.web_scrapper_graph.nodes.parse_main_text_date import parsed_struct_text
from backend.pipelines.graphs.web_scrapper_graph.nodes.gather_articles import gather_articles

import json

from backend.pipelines.graphs.web_scrapper_graph.nodes.hardcoded_website import get_posts_hardcoded
from backend.pipelines.graphs.web_scrapper_graph.nodes.send_articles import send_article

builder = StateGraph(OverallState,
                     input=InitState,
                     output=OverallState
                     )

builder.add_node("Get Posts", get_posts_hardcoded)
builder.add_node("Parse Structured Post", parsed_struct_text)
builder.add_node("Gather all Posts Together", gather_articles)


builder.add_edge(START, "Get Posts")
builder.add_conditional_edges("Get Posts", send_article, ["Parse Structured Post"])
builder.add_edge("Parse Structured Post", "Gather all Posts Together")
builder.add_edge("Gather all Posts Together", END)

graph = builder.compile()


