# api/podcasts.py
from quart import jsonify, Blueprint
from pipelines.podcast import create_podcast

bp = Blueprint("podcasts", __name__)


@bp.post("/podcasts/regenerate")
async def reg_podcast():
    try:
        print("Starting podcast generation...")

        # Generate podcast
        audio_bytes, answer = await create_podcast()

        # Convert binary data to base64 for JSON serialization
        import base64

        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        return jsonify(
            {
                "success": True,
                "voice": audio_base64,  # Send as base64 string
                "text": answer,
                "answer": answer,
            }
        )

    except Exception as e:
        print(f"Detailed error in reg_podcast: {type(e).__name__}: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
