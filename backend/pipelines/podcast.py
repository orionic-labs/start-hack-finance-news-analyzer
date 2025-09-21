from elevenlabs.client import ElevenLabs
from elevenlabs import play
import os
from dotenv import load_dotenv
import json
from db.session import SessionLocal
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from utils.helpers import extract_text_inside_tags

load_dotenv()

client = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY")
)

async def fetch_last_week_texts(session, table_name="articles"):
    since = datetime.now(timezone.utc) - timedelta(days=1)

    q = text(f"""
        SELECT
            COALESCE(title, '')        AS title,
            COALESCE(raw, '')    AS main_text
        FROM {table_name}
        WHERE fetched_at >= :since
    """)
    
    # Await the async database call
    result = await session.execute(q, {"since": since})
    rows = result.mappings().all()
    
    texts = []
    for row in rows:
        texts.append(f"Title: {row['title']}\nContent: {row['main_text']}")
    
    return texts

SYSTEM_PROMPT = """
IMPORTANT: user input will be provided as a collection of parsed financial and business news articles from the last 24 hours!

You are an AI assistant specializing in transforming financial news into a natural, engaging podcast script. 
Your task is to output a single coherent narration that sounds like a witty financial commentator talking about the latest world and market news.

Required Output Format:
<answer>
[final conversational script as plain text]
</answer>

Instructions:
1. Carefully analyze the provided financial and business news articles.
2. Select and summarize the most relevant stories from the last 24 hours (world news, markets, central banks, corporate news).
3. Write the output as if you are the host of a finance podcast:
   - Sound casual, sharp, and engaging.
   - Use humor or light sarcasm occasionally (e.g., playful remarks about Wall Street, crypto volatility, central banks, CEOs).
   - Make smooth transitions between topics ("Meanwhile in crypto land...", "Over in Europe, markets are...").
   - Mention the news provider briefly for credibility ("Bloomberg reports", "Reuters notes").
   - You can sometimes make jokes
4. Do not invent facts; stick to the input content.
5. Keep the narration continuous, friendly, and fun to listen to — no bullet points or lists.
6. Ensure it feels like a conversation with the listener, not a dry newswire.
7. DO NOT include any extra explanations, metadata, or formatting — only the final script.

Example:
<answer>
"Alright, welcome back to your daily dose of finance! 
Let's start with Wall Street, where tech stocks tried to rally — keyword: tried — before Jerome Powell opened his mouth and sent everyone running for cover. 
Over in Europe, the ECB is playing it cool, but inflation numbers say otherwise. 
And crypto? Oh, Bitcoin had another rollercoaster day, because of course it did. 
That's your snapshot of the financial world today — equal parts chaos and comedy, as always."
</answer>
"""


async def create_podcast(voice_id="0UusJbwWpzPDiWWzB6e8"):
    async with SessionLocal() as session:
        texts = await fetch_last_week_texts(session)
        
        if not texts:
            texts = ["No recent articles found. Here is a summary of market conditions."]

        model = ChatOpenAI(model="gpt-4o")
        
        news = " | ".join(texts)
        message = HumanMessage(content=news)

        # Create message and prompt chain
        assistant_prompt = ChatPromptTemplate.from_messages([
            ('system', SYSTEM_PROMPT),
            message
        ])

        # Invoke the model
        assistant_chain = assistant_prompt | model
        raw_response = assistant_chain.invoke({})

        # Extract hypothesis and validate
        answer = extract_text_inside_tags(raw_response.content, "answer")

        audio = client.text_to_speech.convert(
            text=answer,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
        )
        with open("audio.mp3", "wb") as f:
            for chunk in audio:
                f.write(chunk)
                
        audio_bytes = b"".join(client.text_to_speech.convert(
            text=answer,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
        ))

        return audio_bytes, answer