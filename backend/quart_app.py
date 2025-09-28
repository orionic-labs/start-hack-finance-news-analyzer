# server entrypoint (Quart)
import os
from urllib.parse import urlparse
from quart import request, make_response
from backend.app import create_app
from core.tasks import register_tasks

app = create_app()

BASE_ALLOWED = {
    "https://start-hack-finance-news-analyzer.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}
ALLOWED_ORIGINS = BASE_ALLOWED | {
    o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
}

def _is_allowed(origin: str | None) -> bool:
    if not origin:
        return False
    if origin in ALLOWED_ORIGINS:
        return True
    # allow your preview deployments on vercel
    try:
        host = urlparse(origin).hostname or ""
    except Exception:
        return False
    return host.endswith(".vercel.app")

def _apply_cors(resp, origin: str | None):
    # Remove/override any stray wildcard coming from upstream or other middleware
    if resp.headers.get("Access-Control-Allow-Origin") == "*":
        resp.headers.pop("Access-Control-Allow-Origin", None)

    if _is_allowed(origin):
        resp.headers["Access-Control-Allow-Origin"] = origin      # echo exact origin
        resp.headers["Access-Control-Allow-Credentials"] = "true" # you use cookies
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE, PATCH"
        resp.headers["Access-Control-Allow-Headers"] = (
            request.headers.get("Access-Control-Request-Headers")
            or "Content-Type, Authorization, X-Requested-With"
        )
        resp.headers["Access-Control-Max-Age"] = "600"
        resp.headers["Vary"] = "Origin"
    return resp


@app.before_request
async def log_request():
    print(">>>", request.method, request.path, dict(request.headers))



@app.before_request
async def handle_preflight():
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin")
        resp = await make_response("", 204)
        return _apply_cors(resp, origin)

@app.after_request
async def add_cors_headers(response):
    origin = request.headers.get("Origin")
    return _apply_cors(response, origin)

tasks = register_tasks(app)

if __name__ == "__main__":  # fix the dunder name
    app.run(debug=True, host="0.0.0.0", port=5001)
