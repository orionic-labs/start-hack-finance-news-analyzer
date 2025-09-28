# core/tasks.py
from __future__ import annotations
from datetime import timedelta
from quart_tasks import QuartTasks
from pipelines.graphs.graph import graph


def register_tasks(app):
    tasks = QuartTasks(app)

    @tasks.periodic(timedelta(seconds=30))
    async def schedule():
        sources = [
            "https://www.cnbc.com/id/100003114/device/rss/rss.html",
            "https://www.reuters.com/world/",
            "https://finance.yahoo.com/news/"
        ]
        for source in sources:
            await graph.ainvoke({"link": source})

    return tasks
