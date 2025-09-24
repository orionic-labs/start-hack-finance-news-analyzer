# quart_app.py
from backend.app import create_app
from core.tasks import register_tasks
from quart_tasks import QuartTasks
from datetime import timedelta
from backend.pipelines.graphs import graph


app = create_app()
tasks = register_tasks(app)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
