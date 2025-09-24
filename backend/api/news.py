# api/news.py
from quart import Blueprint, jsonify, request
from sqlalchemy import text
from backend.db.session import SessionLocal
from pydantic import ValidationError
from backend.schemas import AnalyzeNewsRequest, ImportancePayload

bp = Blueprint("news", __name__)


async def analyze_article_async(title: str, text: str, language: str = "en"):
    return {
        "sentiment": "neutral",
        "language": language,
        "title_len": len(title),
        "text_len": len(text),
    }


def _validate(model, data):
    try:
        return model(**(data or {}))
    except ValidationError as e:
        from quart import abort

        abort(400, description=e.json())


@bp.get("/news/list")
async def list_news():
    try:
        async with SessionLocal() as session:
            query = text(
                """
                WITH latest_aa AS (
                  SELECT DISTINCT ON (article_url)
                      article_url, impact_score, important, created_at, id
                  FROM article_analysis
                  ORDER BY article_url, created_at DESC, id DESC
                )
                SELECT a.id, a.url, a.source_domain, a.title, a.summary,
                       a.published_at, a.image_url,
                       laa.impact_score, laa.important AS importance_flag
                FROM articles a
                JOIN latest_aa laa ON laa.article_url = a.url
                WHERE laa.impact_score >= 20
                ORDER BY a.published_at DESC
                LIMIT 50
            """
            )
            rows = (await session.execute(query)).mappings().all()

            items = []
            for row in rows:
                published_at = (
                    row["published_at"].isoformat() if row["published_at"] else None
                )
                impact_score = row.get("impact_score", 0) or 0
                db_flag = row.get("importance_flag")
                is_important = (
                    bool(db_flag) if db_flag is not None else (impact_score >= 60)
                )
                importance_label = (
                    "high"
                    if impact_score > 75
                    else ("medium" if impact_score > 50 else "low")
                )
                items.append(
                    {
                        "id": row["id"],
                        "url": row["url"],
                        "source": row["source_domain"],
                        "title": row["title"],
                        "summary": row["summary"],
                        "publishedAt": published_at,
                        "photo": row.get("image_url"),
                        "isImportant": is_important,
                        "importance": importance_label,
                        "markets": [],
                        "clients": [],
                        "communitySentiment": int(min(impact_score * 1.2, 100)),
                        "trustIndex": int(min(impact_score * 1.3, 100)),
                    }
                )
            return jsonify(items)
    except Exception:
        return jsonify({"error": "Failed to fetch news"}), 500


@bp.post("/news/importance")
async def set_importance():
    data = _validate(ImportancePayload, await request.get_json(force=True))
    try:
        async with SessionLocal() as session:
            cur = await session.execute(
                text("SELECT important FROM article_analysis WHERE article_url = :url"),
                {"url": data.url},
            )
            row = cur.mappings().first()

            if row is None:
                new_val = True if data.important is None else bool(data.important)
                await session.execute(
                    text(
                        "INSERT INTO article_analysis (article_url, important) VALUES (:url, :val)"
                    ),
                    {"url": data.url, "val": new_val},
                )
            else:
                current = row["important"]
                new_val = (
                    (not bool(current))
                    if data.important is None
                    else bool(data.important)
                )
                upd = await session.execute(
                    text(
                        "UPDATE article_analysis SET important = :val WHERE article_url = :url"
                    ),
                    {"url": data.url, "val": new_val},
                )
                if upd.rowcount == 0:
                    await session.execute(
                        text(
                            "INSERT INTO article_analysis (article_url, important) VALUES (:url, :val)"
                        ),
                        {"url": data.url, "val": new_val},
                    )
            await session.commit()
            return jsonify({"ok": True, "url": data.url, "important": new_val})
    except Exception:
        return jsonify({"error": "Failed to update importance"}), 500


@bp.get("/news/detail/<path:url>")
async def get_news_detail(url):
    try:
        async with SessionLocal() as session:
            q = text(
                """
                SELECT a.url AS id, a.url, a.source_domain, a.title, a.summary, a.raw AS content,
                       a.published_at, a.image_url,
                       COALESCE(aa.impact_score, 0) AS impact_score, aa.important AS importance_flag
                FROM articles a
                LEFT JOIN article_analysis aa ON a.url = aa.article_url
                WHERE a.url = :url
                LIMIT 1
            """
            )
            row = (await session.execute(q, {"url": url})).mappings().first()
            if not row:
                return jsonify({"error": "News article not found"}), 404

            published_at = (
                row["published_at"].isoformat() if row["published_at"] else None
            )
            impact_score = row.get("impact_score", 0) or 0
            db_flag = row.get("importance_flag")
            is_important = (
                bool(db_flag) if db_flag is not None else (impact_score >= 60)
            )
            importance_label = (
                "high"
                if impact_score > 75
                else "medium" if impact_score > 50 else "low"
            )

            return jsonify(
                {
                    "id": row["id"],
                    "url": row["url"],
                    "source": row["source_domain"],
                    "title": row["title"],
                    "summary": row["summary"],
                    "content": row["content"],
                    "publishedAt": published_at,
                    "photo": row.get("image_url"),
                    "isImportant": is_important,
                    "importance": importance_label,
                    "markets": [],
                    "clients": [],
                    "communitySentiment": int(min(impact_score * 1.2, 100)),
                    "trustIndex": int(min(impact_score * 1.3, 100)),
                }
            )
    except Exception:
        return jsonify({"error": "Failed to fetch news detail"}), 500


@bp.post("/news/send_to_chat")
async def send_to_chat():
    payload = await _validate(AnalyzeNewsRequest, await request.get_json(force=True))
    result = await analyze_article_async(payload.title, payload.text, payload.language)
    return jsonify(result)
