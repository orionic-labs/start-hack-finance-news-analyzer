from transformers import pipeline
from backend.pipelines.graphs.company_sentiment_analysis_graph.state import OverallState, SubState

sentiment_model = pipeline(
    "sentiment-analysis",
    model="mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis"
)

MAX_ATTEMPTS = 3

def entity_sentiment_analysis(state: SubState) -> OverallState:
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            article_text = state["text"]

            # Run sentiment analysis
            raw_response = sentiment_model(article_text)[0]

            result_state = {
                "entities_sentiment": [{
                    "asset_id": state["insert_article_id"],
                    "entity": state["entity"],
                    "label": raw_response["label"],
                    "score": raw_response["score"]
                }]
            }

            return result_state

        except ValueError as e:
            print(f"Attempt {attempt}/{MAX_ATTEMPTS} failed: {e}")
            if attempt == MAX_ATTEMPTS:
                raise
        except Exception as e:
            print(f"Attempt {attempt}/{MAX_ATTEMPTS} failed: {e}")
            if attempt == MAX_ATTEMPTS:
                raise
