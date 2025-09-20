# put this near the top of app_quart.py (or a utils/mail.py)
import os
from email.message import EmailMessage
import aiosmtplib

async def send_email_async(
    to: str,
    subject: str,
    text: str | None = None,
    html: str | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
):
    msg = EmailMessage()
    from_addr = os.getenv("MAIL_FROM") or os.getenv("SMTP_USER")
    if not from_addr:
        raise RuntimeError("MAIL_FROM or SMTP_USER must be set")

    msg["From"] = from_addr
    msg["To"] = to
    if cc:
        msg["Cc"] = ", ".join(cc)
    msg["Subject"] = subject

    # text / html body
    if html and text:
        msg.set_content(text)
        msg.add_alternative(html, subtype="html")
    elif html:
        msg.add_alternative(html, subtype="html")
    else:
        msg.set_content(text or "")

    recipients = [to] + (cc or []) + (bcc or [])

    # SMTP config
    host = os.getenv("SMTP_HOST", "localhost")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")

    # STARTTLS flow (typical for port 587). For port 465, use an SMTP client with use_tls=True.
    await aiosmtplib.send(
        msg,
        recipients=recipients,
        hostname=host,
        port=port,
        username=user,
        password=password,
        start_tls=True,
    )
