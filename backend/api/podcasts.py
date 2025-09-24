# api/podcasts.py
from quart import jsonify, Blueprint
from pipelines.podcast import create_podcast
import uuid
import asyncio

jobs: dict[str, dict] = {}

bp = Blueprint("podcasts", __name__)


@bp.post("/podcasts/start")
async def reg_podcast():
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued", "result": None}

    async def run_job():
        try:
            jobs[job_id]["status"] = "running"
            audio_bytes, answer = await create_podcast()
            import base64

            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

            jobs[job_id] = {
                "status": "done",
                "result": {"voice": audio_base64, "answer": answer},
            }
        except Exception as e:
            jobs[job_id] = {"status": "error", "result": str(e)}

    asyncio.create_task(run_job())
    return jsonify({"jobId": job_id})


@bp.get("/podcasts/status/<job_id>")
async def podcast_status(job_id):
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)
