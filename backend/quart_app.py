from backend.app import create_app
from core.tasks import register_tasks
from quart_tasks import QuartTasks
from datetime import timedelta
from backend.pipelines.graphs import graph
from quart_cors import cors  # <-- add this

app = create_app()
app = cors(
    app,
    allow_origin="*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tasks = register_tasks(app)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
