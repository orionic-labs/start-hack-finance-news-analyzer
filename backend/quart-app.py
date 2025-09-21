from __future__ import annotations
# app_quart.py
import os
import io
import anyio
from email.message import EmailMessage
from db.session import SessionLocal, engine, Base
from db.models import Account
from security.crypto import encrypt_secret
from pydantic import ValidationError
import asyncio
from quart import Quart, Blueprint, request, jsonify, send_file, abort
from quart_cors import cors
from pydantic import BaseModel, Field, ValidationError, EmailStr
from dotenv import load_dotenv
from typing import Union, Optional
# imports you need at top of app_quart.py
import tempfile
from scripts.render_report_pdf import render_report_pdf
from scripts.general_report_generator import call_llm
from quart_tasks import QuartTasks
from datetime import datetime, timedelta
from backend.pipelines.graphs.graph import graph


# ---------- Schemas ----------
class IngestRequest(BaseModel):
    source_urls: list[str] = Field(min_items=1)
    deduplicate: bool = True

class AnalyzeNewsRequest(BaseModel):
    title: str
    text: str
    language: str = "en"

class RagQueryRequest(BaseModel):
    query: str = Field(min_length=2)
    top_k: int = 5

class SendEmailRequest(BaseModel):
    to: EmailStr
    subject: str
    text: Optional[str] = None
    html: Optional[str] = None
    cc: list[EmailStr] = []
    bcc: list[EmailStr] = []

# MVP CRUD-ish payloads
class AccountPayload(BaseModel):
    id: Optional[str] = None
    platform: str
    username: str
    password: str

class ClientPayload(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr

class SourcePayload(BaseModel):
    id: Optional[str] = None
    name: str
    url: str

class ReportRequest(BaseModel):
    body: str
    filename: str = "report.pdf"
    company: Optional[str] = None
    report_title: Optional[str] = None
    report_date: Optional[str] = None
    logo_path: Optional[str] = None
    include_cover: bool = True
# ---------- Helpers ----------
async def validate(model, data):
    try:
        return model(**(data or {}))
    except ValidationError as e:
        abort(400, description=e.json())


async def to_thread(func, *args, **kwargs):
    return await anyio.to_thread.run_sync(lambda: func(*args, **kwargs))

# ---------- (TEMP) Service stubs ----------
def run_ingest_sync(urls: list[str], dedup: bool = True):
    return {"ingested": len(urls), "deduplicated": dedup}

async def analyze_article_async(title: str, text: str, language: str = "en"):
    return {"sentiment": "neutral", "language": language, "title_len": len(title), "text_len": len(text)}

def answer_query_sync(query: str, top_k: int = 5):
    return {"answer": f"Stub answer for: {query}", "sources": [{"title": "Example", "url": "https://example.com"}]}

# ---------- Email ----------
import aiosmtplib

async def send_email_async(
    to: str,
    subject: str,
    text: Union[str, None] = None,
    html: Union[str, None] = None,
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

    if html and text:
        msg.set_content(text)
        msg.add_alternative(html, subtype="html")
    elif html:
        msg.add_alternative(html, subtype="html")
    else:
        msg.set_content(text or "")

    recipients = [to] + (cc or []) + (bcc or [])

    await aiosmtplib.send(
        msg,
        recipients=recipients,
        hostname=os.getenv("SMTP_HOST", "localhost"),
        port=int(os.getenv("SMTP_PORT", "587")),
        username=os.getenv("SMTP_USER"),
        password=os.getenv("SMTP_PASS"),
        start_tls=True,
    )

# ---------- Blueprint / Routes ----------
api = Blueprint("api", __name__)

@api.get("/health")
async def health():
    return {"status": "ok"}

@api.post("/news/send_to_chat")
async def send_to_chat():
    payload = await validate(AnalyzeNewsRequest, await request.get_json(force=True))
    result = await analyze_article_async(payload.title, payload.text, payload.language)
    return jsonify(result)

@api.post("/reports/send_email")
async def send_email():
    payload = await validate(SendEmailRequest, await request.get_json(force=True))
    await send_email_async(
        to=str(payload.to),
        subject=payload.subject,
        text=payload.text,
        html=payload.html,
        cc=[str(e) for e in payload.cc],
        bcc=[str(e) for e in payload.bcc],
    )
    return jsonify({"ok": True, "message": "Email accepted for delivery"}), 202

@api.post("/reports/download_pdf")
async def download_pdf():
    # validate() is your existing helper
    payload = await validate(ReportRequest, await request.get_json(force=True))

    # Render to a temp file in a worker thread (non-blocking for Quart)
    async def _render_to_tmp() -> bytes:
        def work() -> bytes:
            with tempfile.TemporaryDirectory() as tmp:
                out_path = os.path.join(tmp, payload.filename)
                render_report_pdf(
                    payload.body,
                    out_path,
                    company=payload.company,
                    report_title=payload.report_title,
                    report_date=payload.report_date,
                    logo_path=payload.logo_path,
                    include_cover=payload.include_cover,
                )
                with open(out_path, "rb") as f:
                    return f.read()
        return await anyio.to_thread.run_sync(work)

    try:
        pdf_bytes = await _render_to_tmp()
    except FileNotFoundError as e:
        # e.g., missing logo file path
        abort(400, description=f"Asset missing: {e}")
    except Exception:
        abort(501, description="PDF generator unavailable")

    return await send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=payload.filename,
    )


@api.post("/reports/regenerate")
async def reg_report():
    payload = await validate(RagQueryRequest, await request.get_json(force=True))
    return "News text"

@api.post("/podcasts/regenerate")
async def reg_podcast():
    payload = await validate(RagQueryRequest, await request.get_json(force=True))
    out = await to_thread(answer_query_sync, payload.query, payload.top_k)
    return jsonify({"answer": out.get("answer", ""), "sources": out.get("sources", [])})

# ---- Accounts
@api.post("/accounts/add_account")
async def add_account():
    data = await request.get_json(force=True)
    try:
        payload = AccountCreate(**data)
    except ValidationError as e:
        abort(400, description=e.json())

    # Encrypt the password
    password_enc = encrypt_secret(payload.password)

    # Persist
    async with SessionLocal() as session:
        acct = Account(
            platform=payload.platform,
            link=str(payload.link),
            username=payload.username,
            password_enc=password_enc,
        )
        session.add(acct)
        await session.commit()
        await session.refresh(acct)

    # Return safe data only
    out = AccountOut(
        id=str(acct.id),
        platform=acct.platform,
        link=acct.link,
        username=acct.username,
    )
    return jsonify(out.model_dump()), 201

@api.post("/accounts/edit_account")
async def edit_account():
    payload = await validate(AccountPayload, await request.get_json(force=True))
    # TODO: update DB by payload.id
    return jsonify({"ok": True, "account": payload.model_dump()}), 200

@api.post("/accounts/delete_account")
async def delete_account():
    body = await request.get_json(force=True)
    account_id = (body or {}).get("id")
    if not account_id:
        abort(400, description='{"error":"id is required"}')
    # TODO: delete in DB
    return jsonify({"ok": True, "deleted_id": account_id}), 200

# ---- Clients
@api.post("/clients/add_client")
async def add_client():
    payload = await validate(ClientPayload, await request.get_json(force=True))
    return jsonify({"ok": True, "client": payload.model_dump()}), 201

@api.post("/clients/edit_client")
async def edit_client():
    payload = await validate(ClientPayload, await request.get_json(force=True))
    return jsonify({"ok": True, "client": payload.model_dump()}), 200

# ---- Sources
@api.post("/sources/add_source")
async def add_source():
    payload = await validate(SourcePayload, await request.get_json(force=True))
    return jsonify({"ok": True, "source": payload.model_dump()}), 201

@api.post("/sources/edit_source")
async def edit_source():
    payload = await validate(SourcePayload, await request.get_json(force=True))
    return jsonify({"ok": True, "source": payload.model_dump()}), 200

# ---------- App factory ----------
def create_app() -> Quart:
    load_dotenv()
    app = Quart(__name__)
    tasks = QuartTasks(app)
    app = cors(app, allow_origin="*")
    app.config.update(JSON_SORT_KEYS=False)

    from werkzeug.exceptions import HTTPException
    @app.errorhandler(HTTPException)
    async def http_err(e: HTTPException):
        return jsonify({"error": e.description, "status": e.code}), e.code

    @app.errorhandler(Exception)
    async def unhandled(e: Exception):
        app.logger.exception("Unhandled error")
        return jsonify({"error": "Internal Server Error"}), 500
    
    @app.before_serving
    async def init_db():
        # MVP: ensure tables exist (use Alembic later in prod)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    app.register_blueprint(api, url_prefix="/api")
    return app

app = create_app()
tasks = QuartTasks(app)

@tasks.periodic(timedelta(seconds=1))
async def schedule_news_update():



if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)