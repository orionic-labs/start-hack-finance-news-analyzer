# api/chatbot.py
from quart import Blueprint, jsonify, request
from backend.pipelines.chatbot import graph as chatbot_graph
import ast
from langchain_core.messages import HumanMessage

bp = Blueprint("chatbot", __name__)


@bp.post("/chatbot/send_message_chat")
async def send_message_chat():
    try:
        print("Starting chatbot message...")

        data = await request.get_json(force=True)
        question = data.get("customers", [])

        response = chatbot_graph.invoke({"messages": [HumanMessage(content=question)]})
        last_message = response["messages"][-1]
        data = ast.literal_eval(last_message.content)
        answer = data["choices"][0]["message"]["content"]

        print(answer)

        return jsonify({"answer": answer})
    except Exception as e:
        print(f"Detailed error in send_message_chat: {type(e).__name__}: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
