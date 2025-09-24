from twilio.rest import Client
import asyncio
from dotenv import load_dotenv
# put your Twilio credentials here
TWILIO_SID = load_dotenv("TWILIO_SID")
TWILIO_AUTH_TOKEN = load_dotenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = load_dotenv("TWILIO_PHONE")   # your Twilio number
MY_PHONE = load_dotenv("MY_PHONE")     # your personal number

client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)

async def send_sms_alert(article_url: str, packet: dict):
    body = f"🚨 Important Article Alert\n{article_url}\nSummary: {packet['packet']['executive_summary']}"
    message = client.messages.create(
        body=body,
        from_=TWILIO_PHONE,
        to=MY_PHONE
    )
    print(f"SMS sent: {message.sid}")
if __name__ == "__main__":
    article_url = "https://example.com/important-article"
    packet = {"packet": {"executive_summary": "This is a test summary."}}
    asyncio.run(send_sms_alert(article_url, packet))