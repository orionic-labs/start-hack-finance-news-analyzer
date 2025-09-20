# run_pipeline.py
from __future__ import annotations

import sys
from textwrap import shorten
from dotenv import load_dotenv

# Load .env so DATABASE_URL / OPENAI_API_KEY are available
load_dotenv()

# Import the compiled graph
try:
    from pipelines.ingest_graph import graph  # restructured path
except ImportError:
    from graph import graph  # fallback if you kept the old location

# DB insert (with simhash + embedding dedup inside)
try:
    from repositories.articles import insert_article
except ImportError:
    raise RuntimeError(
        "repositories.articles.insert_article not found. Check your imports/paths."
    )


def main():
    # CLI args: url and article text (optional)
    url = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "https://news.example.com/acme/q3-press-release"
    )
    article = (
        sys.argv[2]
        if len(sys.argv) > 2
        else "Press release: Acme Corp Q3 results, revenue up 12% y/y, EPS beat; guidance raised."
    )

    print("\n=== INPUT ===")
    print("URL:", url)
    print("Article (first 160 chars):", shorten(article, width=160, placeholder="..."))

    # 1) Run graph: normalize -> simhash -> embedding (your normalize_article node handles it)
    state_in = {"url": url, "unstructured_article": article}
    state_out = graph.invoke(state_in)
    row = state_out["article_row"]

    print("\n=== NORMALIZED ===")
    print("title       :", row.get("title"))
    print(
        "summary     :", shorten(row.get("summary") or "", width=200, placeholder="...")
    )
    print("published_at:", row.get("published_at"))
    print("lang        :", row.get("lang"))
    print("source_domain:", row.get("source_domain"))
    print("hash_64     :", row.get("hash_64"))
    print("has embedding:", bool(row.get("content_emb")))

    # 2) Push to DB (repositories.articles does: simhash dedup -> embedding dedup -> insert)
    print("\n=== DB WRITE ===")
    status, ref_url, metric = insert_article(row)
    print("status:", status)
    if ref_url:
        print("matched row:", ref_url)
    if metric is not None:
        print("metric:", metric)

    print("\nDone.")


if __name__ == "__main__":
    main()
