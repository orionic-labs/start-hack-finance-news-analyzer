# quart_app.py
import re
from quart_cors import cors
from backend.app import create_app
from core.tasks import register_tasks

ALLOWED = [
    "https://start-hack-finance-news-analyzer.vercel.app",
    re.compile(r"^https://[a-z0-9-]+\.vercel\.app$"),
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    re.compile(
        r"^http://(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(?::\d+)?$"
    ),
]

app = create_app()
tasks = register_tasks(app)

app = cors(
    app,
    allow_origin=ALLOWED,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Type", "Content-Length"],
    max_age=600,
)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
