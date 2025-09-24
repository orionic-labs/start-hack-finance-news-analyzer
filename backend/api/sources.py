# api/sources.py
from quart import Blueprint, jsonify, request
from sqlalchemy import text
from backend.db.session import SessionLocal
from pydantic import ValidationError
from datetime import datetime, timezone
import json
import uuid

bp = Blueprint("sources", __name__)


def _validate(model, data):
    try:
        return model(**(data or {}))
    except ValidationError as e:
        from quart import abort

        abort(400, description=e.json())


@bp.get("/sources/list")
async def list_sources():
    try:
        async with SessionLocal() as session:
            query = text(
                """
                SELECT 
                    id,
                    name,
                    url,
                    category,
                    description,
                    status,
                    last_update,
                    articles_per_day,
                    reliability,
                    keywords,
                    enabled
                FROM sources
                ORDER BY name
            """
            )

            result = await session.execute(query)
            rows = result.mappings().all()

            sources = []
            for row in rows:
                # Format last_update as "X hours ago"
                last_update = row.get("last_update")
                if last_update:
                    time_diff = datetime.now(timezone.utc) - last_update
                    hours_ago = int(time_diff.total_seconds() / 3600)
                    last_update_str = f"{hours_ago} hours ago"
                else:
                    last_update_str = "Never"

                # Parse keywords from JSON string
                keywords_str = row.get("keywords")
                keywords = []
                if keywords_str:
                    try:
                        keywords = json.loads(keywords_str)
                    except:
                        pass

                sources.append(
                    {
                        "id": str(row["id"]),
                        "name": row["name"],
                        "url": row["url"],
                        "category": row["category"],
                        "description": row["description"],
                        "status": row["status"],
                        "lastUpdate": last_update_str,
                        "articlesPerDay": (
                            float(row["articles_per_day"])
                            if row["articles_per_day"]
                            else 0
                        ),
                        "reliability": (
                            float(row["reliability"]) if row["reliability"] else 0
                        ),
                        "keywords": keywords,
                        "enabled": bool(row["enabled"]),
                    }
                )

            return jsonify(sources)
    except Exception as e:
        print(f"Error fetching sources: {e}")
        return jsonify({"error": str(e)}), 500


@bp.post("/sources/add")
async def add_source():
    try:
        data = await request.get_json(force=True)

        # Validate required fields
        if not data.get("name") or not data.get("url"):
            return jsonify({"error": "Name and URL are required"}), 400

        # Format keywords as JSON string
        keywords = data.get("keywords", [])
        keywords_json = json.dumps(keywords) if keywords else None

        async with SessionLocal() as session:
            query = text(
                """
                INSERT INTO sources 
                (id, name, url, category, description, status, articles_per_day, reliability, keywords, enabled)
                VALUES (:id, :name, :url, :category, :description, :status, :articles_per_day, :reliability, :keywords, :enabled)
                RETURNING id
            """
            )

            result = await session.execute(
                query,
                {
                    "id": str(uuid.uuid4()),
                    "name": data.get("name"),
                    "url": data.get("url"),
                    "category": data.get("category"),
                    "description": data.get("description"),
                    "status": data.get("status", "active"),
                    "articles_per_day": data.get("articlesPerDay"),
                    "reliability": data.get("reliability"),
                    "keywords": keywords_json,
                    "enabled": data.get("enabled", True),
                },
            )

            inserted_id = result.scalar_one()
            await session.commit()

            return jsonify({"ok": True, "id": str(inserted_id)}), 201
    except Exception as e:
        print(f"Error adding source: {e}")
        return jsonify({"error": str(e)}), 500
