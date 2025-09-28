# app/__init__.py
from __future__ import annotations
from quart import Quart, jsonify
from dotenv import load_dotenv
from backend.db.session import engine
from backend.db.models import Base
from backend.app.register_blueprints import register_blueprints
from werkzeug.exceptions import HTTPException


def create_app() -> Quart:
    load_dotenv()
    app = Quart(__name__)

    app.config.update(JSON_SORT_KEYS=False)

    @app.errorhandler(HTTPException)
    async def http_err(e: HTTPException):
        return jsonify({"error": e.description, "status": e.code}), e.code

    @app.errorhandler(Exception)
    async def unhandled(e: Exception):
        app.logger.exception("Unhandled error")
        return jsonify({"error": "Internal Server Error"}), 500

    @app.before_serving
    async def init_db():
        pass

    register_blueprints(app)  # /api/* endpoints
    return app
