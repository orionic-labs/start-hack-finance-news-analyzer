# app/register_blueprints.py
from quart import Quart
from backend.api.health import bp as health_bp
from backend.api.news import bp as news_bp
from backend.api.reports import bp as reports_bp
from backend.api.podcasts import bp as podcasts_bp
from backend.api.chatbot import bp as chatbot_bp
from backend.api.accounts import bp as accounts_bp
from backend.api.sources import bp as sources_bp
from backend.api.clients import bp as clients_bp


def register_blueprints(app: Quart) -> None:
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(news_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")
    app.register_blueprint(podcasts_bp, url_prefix="/api")
    app.register_blueprint(chatbot_bp, url_prefix="/api")
    app.register_blueprint(accounts_bp, url_prefix="/api")
    app.register_blueprint(sources_bp, url_prefix="/api")
    app.register_blueprint(clients_bp, url_prefix="/api")
