import re
from backend.pipelines.graphs.web_scrapper_graph.state import InitState


def check_website(state: InitState) -> InitState:
    link = state.get("link", "").lower()

    if "ft.com" in link:
        answer = "financial_times"
    elif "reuters.com" in link:
        answer = "reuters"
    elif "cnbc.com" in link:
        answer = "cnbc"
    else:
        answer = "unknown"

    return answer