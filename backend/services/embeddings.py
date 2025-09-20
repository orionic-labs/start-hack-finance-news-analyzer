from typing import List
from langchain_openai import OpenAIEmbeddings

_embedding = OpenAIEmbeddings(model="text-embedding-3-small")


def embed_text(text: str) -> List[float]:
    return _embedding.embed_query(text)
