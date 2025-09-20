# services/verify_output.py
from __future__ import annotations
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate


class VerificationResult(BaseModel):
    ok: bool
    issues: List[str] = []


_checker = ChatOpenAI(model="gpt-4o", temperature=0)

verify_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You verify that the summary uses only information present in the provided sources.
Return ONLY JSON: ok (bool), issues (string list).
Flag if:
- numbers or tickers appear that are not in sources
- causal claims not supported by text
- incorrect entity names or dates
Sources are authoritative; do not add new info.
SOURCES:
{sources_text}

PACKET:
{packet_text}
""".strip(),
        )
    ]
)


def verify_packet(sources_text: str, packet_json: Dict[str, Any]) -> VerificationResult:
    chain = verify_prompt | _checker.with_structured_output(VerificationResult)
    return chain.invoke({"sources_text": sources_text, "packet_text": str(packet_json)})
