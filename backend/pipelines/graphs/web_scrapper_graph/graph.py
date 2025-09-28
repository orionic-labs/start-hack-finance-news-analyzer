from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import START, END
from langgraph.graph import StateGraph
from backend.pipelines.graphs.web_scrapper_graph.state import InitState, OverallState
from backend.pipelines.graphs.web_scrapper_graph.nodes.parse_main_text_date import parsed_struct_text
from backend.pipelines.graphs.web_scrapper_graph.nodes.gather_articles import gather_articles
from backend.pipelines.graphs.web_scrapper_graph.nodes.check_website import check_website
from backend.pipelines.graphs.web_scrapper_graph.nodes.financial_times import get_posts_hardcoded_ft
from backend.pipelines.graphs.web_scrapper_graph.nodes.cnbc import get_posts_hardcoded_cnbc
from backend.pipelines.graphs.web_scrapper_graph.nodes.yahoo_finance import get_posts_hardcoded_yahoo


import json

from backend.pipelines.graphs.web_scrapper_graph.nodes.hardcoded_website import get_posts_hardcoded
from backend.pipelines.graphs.web_scrapper_graph.nodes.send_articles import send_article

builder = StateGraph(OverallState,
                     input=InitState,
                     output=OverallState
                     )

builder.add_node("Get Posts Reuters", get_posts_hardcoded)
builder.add_node("Get Posts CNBC", get_posts_hardcoded_cnbc)
builder.add_node("Get Posts FT", get_posts_hardcoded_ft)
builder.add_node("Get Posts Yahoo Finance", get_posts_hardcoded_yahoo)
builder.add_node("Parse Structured Post", parsed_struct_text)
builder.add_node("Gather all Posts Together", gather_articles)


builder.add_conditional_edges(
    START,
    check_website,
    {
        "reuters": "Get Posts Reuters",
        "financial_times": "Get Posts FT",
        "yahoo_finance": "Get Posts Yahoo Finance",
        "cnbc": "Get Posts CNBC",
    }
)
builder.add_conditional_edges("Get Posts Reuters", send_article, ["Parse Structured Post"])
builder.add_conditional_edges("Get Posts FT", send_article, ["Parse Structured Post"])
builder.add_conditional_edges("Get Posts CNBC", send_article, ["Parse Structured Post"])
builder.add_conditional_edges("Get Posts Yahoo Finance", send_article, ["Parse Structured Post"])
builder.add_edge("Parse Structured Post", "Gather all Posts Together")
builder.add_edge("Gather all Posts Together", END)

graph = builder.compile()


