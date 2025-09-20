from __future__ import annotations
import json
from textwrap import shorten
from dotenv import load_dotenv

# Load .env so DATABASE_URL / OPENAI_API_KEY are available
load_dotenv()

# Import the compiled graph
try:
    from pipelines.ingest_graph import graph
except ImportError:
    print("Could not import graph from pipelines.ingest_graph")
    # Fallback for original structure
    from graph import graph


def main():
    """
    Reads articles from a JSON file, separates title and main_text,
    and runs each through the full analysis pipeline.
    """
    json_file_path = "parsed_articles_market.json"
    print(
        f"==================== PIPELINE BATCH START ({json_file_path}) ===================="
    )

    try:
        with open(json_file_path, "r") as f:
            articles_data = json.load(f)
    except FileNotFoundError:
        print(f"ERROR: The file '{json_file_path}' was not found.")
        print("Please make sure it is in the same directory as this script.")
        return
    except json.JSONDecodeError as e:
        print(
            f"ERROR: Could not parse '{json_file_path}'. It may not be valid JSON. Details: {e}"
        )
        return

    for i, article_str in enumerate(articles_data):
        try:
            article = json.loads(article_str)
        except json.JSONDecodeError:
            print(f"\n--- Skipping Article {i+1} (Invalid JSON string) ---")
            continue

        url = article.get("url")
        if not url:
            print(f"\n--- Skipping Article {i+1} (Missing URL) ---")
            continue

        # --- LOGIC UPDATED TO MATCH NEW `normalize_article` ---
        # The title is now passed in directly, and 'unstructured_article' is just the main text.
        title = article.get("title", "")
        main_text = article.get("main_text", "")

        print(f"\n\n--- PROCESSING ARTICLE {i+1}/{len(articles_data)} ---")
        print("URL:", url)
        print("Title:", title)
        print(
            "Article Body (first 160 chars):",
            shorten(main_text, width=160, placeholder="..."),
        )

        # Define the initial state for the graph, now including the title.
        initial_state = {
            "url": url,
            "title": title,
            "unstructured_article": main_text,
        }

        print("\n... Invoking analysis graph ...")
        try:
            # Run the graph
            final_state = graph.invoke(initial_state)

            # Print the detailed final state
            print("\n✅ DONE. Final State:")
            for key, value in final_state.items():
                if key == "article_row" and isinstance(value, dict):
                    print(f"  - {key}:")
                    for k, v in value.items():
                        display_v = (
                            shorten(str(v), width=100, placeholder="...")
                            if isinstance(v, str) and len(str(v)) > 100
                            else v
                        )
                        print(f"    - {k}: {display_v}")
                elif key == "analysis" and isinstance(value, dict):
                    print(f"  - {key}:")
                    print(json.dumps(value, indent=4, ensure_ascii=False))
                else:
                    print(f"  - {key}: {value}")

        except Exception as e:
            print(f"\n❌ ERROR processing article {url}: {e}")
            # import traceback
            # traceback.print_exc()

    print("\n\n==================== PIPELINE BATCH COMPLETE ====================")


if __name__ == "__main__":
    main()
