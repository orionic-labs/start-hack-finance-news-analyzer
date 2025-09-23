# api/health.py
from quart import Blueprint, jsonify

bp = Blueprint("health", __name__)


@bp.get("/health")
async def health():
    return jsonify({"status": "ok"})
