import operator
from typing import TypedDict, Annotated, List, Optional, Sequence
from httpx import URL
from langchain_core.documents import Document
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages


class InputState(TypedDict):
    unstructured_article: str
    insert_article_id: int


class OverallState(TypedDict):
    unstructured_article: str
    insert_article_id: int
    entities_news: list
    entities_sentiment: Annotated[list[dict], operator.add]


class SubState(TypedDict):
    text: str
    entity: str
    insert_article_id: int