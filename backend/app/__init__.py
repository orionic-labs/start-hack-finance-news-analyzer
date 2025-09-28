# app/__init__.py
from __future__ import annotations
import os
from quart import Quart, jsonify
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException
from backend.app.register_blueprints import register_blueprints


def create_app() -> Quart:
    load_dotenv()
    app = Quart(__name__)
    app.config.update(
        JSON_SORT_KEYS=False,
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-secret"),
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_DOMAIN=None,
        SESSION_COOKIE_PATH="/",
    )

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

    register_blueprints(app)
    return app
