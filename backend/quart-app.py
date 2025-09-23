# quart-app.py
from app import create_app
from core.tasks import register_tasks

app = create_app()
tasks = register_tasks(app)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
