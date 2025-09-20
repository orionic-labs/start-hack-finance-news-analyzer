import os
import json
from typing import Dict, Any

import base64

from langchain_openai import ChatOpenAI

from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from ..state import InitState, OverallState

from dotenv import load_dotenv


load_dotenv()

def gather_articles(state: OverallState):
    return {}
