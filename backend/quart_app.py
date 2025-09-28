from backend.app import create_app
from core.tasks import register_tasks
from quart_tasks import QuartTasks
from datetime import timedelta
from backend.pipelines.graphs import graph
from quart_cors import cors  # <-- add this
from quart import request

app = create_app()
@app.after_request
async def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and (origin.endswith(".vercel.app") or "localhost:3000" in origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

tasks = register_tasks(app)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
