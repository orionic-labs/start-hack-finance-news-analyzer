# app/__init__.py
from __future__ import annotations
from quart import Quart, jsonify
from quart_cors import cors
from dotenv import load_dotenv
from db.session import engine, Base
from app.register_blueprints import register_blueprints
from werkzeug.exceptions import HTTPException


def create_app() -> Quart:
    load_dotenv()
    app = Quart(__name__)

    # CORS (use your core.settings if you prefer)
    app = cors(
        app,
        allow_origin=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        allow_credentials=True,
    )
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
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    register_blueprints(app)  # /api/* endpoints
    return app
