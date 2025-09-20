import operator
from typing import TypedDict, Annotated, List, Optional, Sequence
from httpx import URL
from langchain_core.documents import Document
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages


class InitState(TypedDict):
    link: str


class OverallState(TypedDict):
    link: str
    articles: list
    new_articles: Annotated[list[dict], operator.add]
    screenshot: str
    parsed_website: str
    article_index: int


class OutputState(TypedDict):
    placeholder: Annotated[list[dict], operator.add]


class SubState(TypedDict):
    article: dict
