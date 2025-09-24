from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage, AIMessage
import requests, os
import operator
from typing import TypedDict, Annotated, List, Optional, Sequence
from dotenv import load_dotenv

load_dotenv()

ENDPOINT = os.getenv("WX_ENDPOINT")
API_KEY  = os.getenv("WX_API_KEY")

def get_iam_token(api_key: str) -> str:
    resp = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        data={
            "apikey": api_key,
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    resp.raise_for_status()
    return resp.json()["access_token"]

class ChatState(dict):
    messages: Annotated[list[dict], operator.add]

def user_input(state: ChatState) -> ChatState:
    return state

def rag_call(state: ChatState) -> ChatState:
    user_msg = state["messages"][-1].content
    token = get_iam_token(API_KEY)

    payload = {
        "messages": [
            {"role": "user", "content": user_msg}
        ]
    }

    r = requests.post(
        ENDPOINT,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=60
    )

    try:
        r.raise_for_status()
    except Exception:
        print("❌ Error:", r.text)
        raise

    data = r.json()
    answer = None
    if "results" in data:
        answer = data["results"][0].get("generated_text") or str(data["results"][0])
    elif "output" in data:
        answer = data["output"]
    else:
        answer = str(data)

    state["messages"].append(AIMessage(content=answer))
    return state


builder = StateGraph(ChatState)
builder.add_node("User Input", user_input)
builder.add_node("RAG", rag_call)

builder.add_edge(START, "User Input")
builder.add_edge("User Input", "RAG")
builder.add_edge("RAG", END)

graph = builder.compile()

