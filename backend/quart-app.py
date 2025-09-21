from __future__ import annotations
# app_quart.py
import os
import uuid
import io
import anyio
import asyncio
import tempfile
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Union, Optional
from sqlalchemy import Column, String, DateTime, Numeric, text
from sqlalchemy.dialects.postgresql import UUID
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError, EmailStr
from quart import Quart, Blueprint, request, jsonify, send_file, abort, make_response
from quart_cors import cors
from pipelines.podcast import create_podcast
from db.session import SessionLocal, engine, Base
from db.models import Account, Source

from security.crypto import encrypt_secret
from scripts.general_report_generator import Customer, call_llm
from scripts.render_report_pdf import render_report_pdf
from db.types import Vector1536
import json

from utils.helpers import utcnow



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
@api.get("/clients/list")
async def list_clients():
    try:
        async with SessionLocal() as session:
            query = text("""
                SELECT 
                    client_id as id,
                    name
                FROM clients
                ORDER BY name
            """)
            
            result = await session.execute(query)
            rows = result.mappings().all()
            
            clients = []
            for row in rows:
                clients.append({
                    "id": str(row['id']),
                    "name": row['name']
                })
            
            return jsonify(clients)
    except Exception as e:
        print(f"Error fetching clients: {e}")  # Log the error
        return jsonify({"error": str(e)}), 500  # Return error to the client

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
    try:
        data = await request.get_json(force=True)
        
        # Extract data from request
        customers_data = data.get("customers", [])
        text = data.get("text", data.get("body", ""))
        filename = data.get("filename", "financial_report.pdf")
        company = data.get("company", "Your Company Name")
        report_title = data.get("report_title", "Financial Report")
        report_date = data.get("report_date", datetime.utcnow().strftime("%Y-%m-%d"))
        logo_path = data.get("logo_path")
        include_cover = data.get("include_cover", True)

        if not text:
            return jsonify({"error": "Text content is required"}), 400

        # Convert customers data to Customer objects
        customers = [
            Customer(
                name=c.get("name", ""),
                portfolio=c.get("portfolio", {}),
                notes=c.get("notes", "")
            )
            for c in customers_data
        ]

        # Generate the report using general_report_generator
        generated_report = await call_llm(text, customers, "gpt-4o-mini", 0.25)

        async def _render_to_tmp() -> bytes:
            def work() -> bytes:
                with tempfile.TemporaryDirectory() as tmp:
                    out_path = os.path.join(tmp, filename)
                    render_report_pdf(
                        generated_report,
                        out_path,
                        company=company,
                        report_title=report_title,
                        report_date=report_date,
                        logo_path=logo_path,
                        include_cover=include_cover,
                    )
                    with open(out_path, "rb") as f:
                        return f.read()
            return await anyio.to_thread.run_sync(work)

        pdf_bytes = await _render_to_tmp()

        # Create response with proper headers
        response = await make_response(pdf_bytes)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    except Exception as e:
        print(f"Error in download_pdf: {e}")
        return jsonify({"error": str(e)}), 500
@api.post("/reports/regenerate")
async def reg_report():
    try:
        data = await request.get_json(force=True)

        customers_data = data.get("customers", [])
        text = data.get("text")

        if not text:
            return jsonify({"error": "Text is required"}), 400

        customers = [
            Customer(
                name=c.get("name", ""),
                portfolio=c.get("portfolio", {}),
                notes=c.get("notes", "")
            )
            for c in customers_data
        ]

        # --- FIX START ---
        # If call_llm is async:
        generated_report = await call_llm(text, customers, "gpt-4o-mini", 0.25)

        # If call_llm is sync:
        # generated_report = await anyio.to_thread.run_sync(
        #     call_llm, text, customers, "gpt-4o-mini", 0.25
        # )
        # --- FIX END ---

        return jsonify({
            "success": True,
            "generatedReport": generated_report,
            "processedAt": datetime.utcnow().isoformat()
        })

    except Exception as e:
        print(f"Error in reg_report: {e}")
        return jsonify({"error": str(e)}), 500

@api.post("/podcasts/regenerate")
async def reg_podcast():
    try:
        print("Starting podcast generation...")
        
        # Generate podcast
        audio_bytes, answer = await create_podcast()
        
        # Convert binary data to base64 for JSON serialization
        import base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        return jsonify({
            "success": True,
            "voice": audio_base64,  # Send as base64 string
            "text": answer,
            "answer": answer
        })
    except Exception as e:
        print(f"Detailed error in reg_podcast: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
# ---- Accounts

# ---- Accounts
@api.get("/accounts/list")
async def list_accounts():
    try:
        async with SessionLocal() as session:
            query = text("""
                SELECT 
                    id,
                    platform,
                    link,
                    username,
                    created_at
                FROM accounts
                ORDER BY created_at DESC
            """)
            
            result = await session.execute(query)
            rows = result.mappings().all()
            
            accounts = []
            for row in rows:
                # Format created_at as "X hours ago"
                created_at = row.get('created_at')
                if created_at:
                    time_diff = datetime.now(timezone.utc) - created_at
                    hours_ago = int(time_diff.total_seconds() / 3600)
                    last_sync = f"{hours_ago} hours ago" if hours_ago > 0 else "Just now"
                else:
                    last_sync = "Never"
                
                accounts.append({
                    "id": str(row['id']),
                    "platform": row['platform'],
                    "link": row['link'],
                    "username": row['username'],
                    "lastSync": last_sync,
                    "status": "active",  # Default status
                    "mediaSource": row['platform']  # Use platform as media source
                })
            
            return jsonify(accounts)
    except Exception as e:
        print(f"Error fetching accounts: {e}")
        return jsonify({"error": str(e)}), 500



@api.post("/accounts/delete")
async def delete_account():
    try:
        data = await request.get_json(force=True)
        account_id = data.get('id')
        
        if not account_id:
            return jsonify({"error": "Account ID is required"}), 400
        
        async with SessionLocal() as session:
            query = text("""
                DELETE FROM accounts 
                WHERE id = :id
                RETURNING id
            """)
            
            result = await session.execute(query, {"id": account_id})
            deleted_id = result.scalar_one_or_none()
            
            if not deleted_id:
                return jsonify({"error": "Account not found"}), 404
                
            await session.commit()
            
            return jsonify({"ok": True, "deleted_id": str(deleted_id)}), 200
    except Exception as e:
        print(f"Error deleting account: {e}")
        return jsonify({"error": str(e)}), 500
@api.get("/news/list")
async def list_news():
    try:
        async with SessionLocal() as session:
            query = text("""
                SELECT 
                    a.url as id,
                    a.url,
                    a.source_domain,
                    a.title,
                    a.summary,
                    a.published_at,
                    a.image_url,
                    COALESCE(aa.impact_score, 0) as impact_score,
                    COALESCE(aa.novelty, 0) as novelty
                FROM articles a
                LEFT JOIN article_analysis aa ON a.url = aa.article_url
                WHERE COALESCE(aa.impact_score, 0) >= 20
                ORDER BY a.published_at DESC
                LIMIT 50
            """)
            
            result = await session.execute(query)
            rows = result.mappings().all()
            
            # Convert to list of dictionaries
            articles = []
            for row in rows:
                # Convert datetime to ISO string
                published_at = row['published_at'].isoformat() if row['published_at'] else None
                
                # Determine importance based on impact score
                impact_score = row.get('impact_score', 0)
                novelty = row.get('novelty', 0)
                importance = "high" if impact_score > 75 else "medium" if impact_score > 50 else "low"
                
                articles.append({
                    "id": row['id'],
                    "url": row['url'],
                    "source": row['source_domain'],
                    "title": row['title'],
                    "summary": row['summary'],
                    "publishedAt": published_at,
                    "photo": row.get('image_url'),  
                    "isImportant": impact_score > 75,
                    "markets": [],
                    "clients": [],
                    "importance": importance,
                    "impactScore": impact_score,  # Add this
                    "novelty": novelty,           # Add this
                    "communitySentiment": int(min(impact_score * 1.2, 100)),
                    "trustIndex": int(min(impact_score * 1.3, 100)),
                })
            
            return jsonify(articles)
    except Exception as e:
        print(f"Error fetching news: {e}")
        return jsonify({"error": str(e)}), 500
@api.get("/news/detail/<path:url>")
async def get_news_detail(url):
    try:
        async with SessionLocal() as session:
            query = text("""
                SELECT 
                    a.url as id,
                    a.url,
                    a.source_domain,
                    a.title,
                    a.summary,
                    a.raw as content,
                    a.published_at,
                    a.image_url,
                    COALESCE(aa.impact_score, 0) as impact_score,
                    COALESCE(aa.novelty, 0) as novelty
                FROM articles a
                LEFT JOIN article_analysis aa ON a.url = aa.article_url
                WHERE a.url = :url
                LIMIT 1
            """)
            
            result = await session.execute(query, {"url": url})
            row = result.mappings().first()
            
            if not row:
                return jsonify({"error": "News article not found"}), 404
                
            # Convert datetime to ISO string
            published_at = row['published_at'].isoformat() if row['published_at'] else None
            
            # Determine importance based on impact score
            impact_score = row.get('impact_score', 0)
            novelty = row.get('novelty', 0)
            importance = "high" if impact_score > 75 else "medium" if impact_score > 50 else "low"
            
            article = {
                "id": row['id'],
                "url": row['url'],
                "source": row['source_domain'],
                "title": row['title'],
                "summary": row['summary'],
                "content": row['content'],
                "publishedAt": published_at,
                "photo": row.get('image_url'),
                "isImportant": impact_score > 75,
                "markets": [],
                "clients": [],
                "importance": importance,
                "impactScore": impact_score,  # Add this
                "novelty": novelty,           # Add this
                "communitySentiment": int(min(impact_score * 1.2, 100)),
                "trustIndex": int(min(impact_score * 1.3, 100)),
            }
            
            return jsonify(article)
    except Exception as e:
        print(f"Error fetching news detail: {e}")
        return jsonify({"error": str(e)}), 500
# ---- Sources
@api.get("/sources/list")
async def list_sources():
    try:
        async with SessionLocal() as session:
            query = text("""
                SELECT 
                    id,
                    name,
                    url,
                    category,
                    description,
                    status,
                    last_update,
                    articles_per_day,
                    reliability,
                    keywords,
                    enabled
                FROM sources
                ORDER BY name
            """)
            
            result = await session.execute(query)
            rows = result.mappings().all()
            
            sources = []
            for row in rows:
                # Format last_update as "X hours ago"
                last_update = row.get('last_update')
                if last_update:
                    time_diff = datetime.now(timezone.utc) - last_update
                    hours_ago = int(time_diff.total_seconds() / 3600)
                    last_update_str = f"{hours_ago} hours ago"
                else:
                    last_update_str = "Never"
                
                # Parse keywords from JSON string
                keywords_str = row.get('keywords')
                keywords = []
                if keywords_str:
                    try:
                        keywords = json.loads(keywords_str)
                    except:
                        pass
                
                sources.append({
                    "id": str(row['id']),
                    "name": row['name'],
                    "url": row['url'],
                    "category": row['category'],
                    "description": row['description'],
                    "status": row['status'],
                    "lastUpdate": last_update_str,
                    "articlesPerDay": float(row['articles_per_day']) if row['articles_per_day'] else 0,
                    "reliability": float(row['reliability']) if row['reliability'] else 0,
                    "keywords": keywords,
                    "enabled": bool(row['enabled'])
                })
            
            return jsonify(sources)
    except Exception as e:
        print(f"Error fetching sources: {e}")
        return jsonify({"error": str(e)}), 500
@api.post("/accounts/add")
async def add_account():
    try:
        data = await request.get_json(force=True)
        
        # Validate required fields
        if not all([data.get('platform'), data.get('link'), data.get('username'), data.get('password')]):
            return jsonify({"error": "Platform, link, username, and password are required"}), 400
        
        # Encrypt the password
        password_enc = encrypt_secret(data.get('password'))
        
        async with SessionLocal() as session:
            query = text("""
                INSERT INTO accounts 
                (id, platform, link, username, password_enc, created_at)
                VALUES (:id, :platform, :link, :username, :password_enc, :created_at)
                RETURNING id
            """)
            
            result = await session.execute(
                query, 
                {
                    "id": str(uuid.uuid4()),
                    "platform": data.get('platform'),
                    "link": data.get('link'),
                    "username": data.get('username'),
                    "password_enc": password_enc,
                    "created_at": datetime.utcnow()
                }
            )
            
            inserted_id = result.scalar_one()
            await session.commit()
            
            return jsonify({"ok": True, "id": str(inserted_id)}), 201
    except Exception as e:
        print(f"Error adding account: {e}")
        return jsonify({"error": str(e)}), 500
@api.post("/sources/add")
async def add_source():
    try:
        data = await request.get_json(force=True)
        
        # Validate required fields
        if not data.get('name') or not data.get('url'):
            return jsonify({"error": "Name and URL are required"}), 400
            
        # Format keywords as JSON string
        keywords = data.get('keywords', [])
        keywords_json = json.dumps(keywords) if keywords else None
        
        async with SessionLocal() as session:
            query = text("""
                INSERT INTO sources 
                (id, name, url, category, description, status, articles_per_day, reliability, keywords, enabled)
                VALUES (:id, :name, :url, :category, :description, :status, :articles_per_day, :reliability, :keywords, :enabled)
                RETURNING id
            """)
            
            result = await session.execute(
                query, 
                {
                    "id": str(uuid.uuid4()),
                    "name": data.get('name'),
                    "url": data.get('url'),
                    "category": data.get('category'),
                    "description": data.get('description'),
                    "status": data.get('status', 'active'),
                    "articles_per_day": data.get('articlesPerDay'),
                    "reliability": data.get('reliability'),
                    "keywords": keywords_json,
                    "enabled": data.get('enabled', True)
                }
            )
            
            inserted_id = result.scalar_one()
            await session.commit()
            
            return jsonify({"ok": True, "id": str(inserted_id)}), 201
    except Exception as e:
        print(f"Error adding source: {e}")
        return jsonify({"error": str(e)}), 500
# ---- Clients
@api.post("/clients/add_client")
async def add_client():
    payload = await validate(ClientPayload, await request.get_json(force=True))
    return jsonify({"ok": True, "client": payload.model_dump()}), 201

@api.post("/clients/edit_client")
async def edit_client():
    payload = await validate(ClientPayload, await request.get_json(force=True))
    return jsonify({"ok": True, "client": payload.model_dump()}), 200



# ---------- App factory ----------
def create_app() -> Quart:
    load_dotenv()
    app = Quart(__name__)
    app = cors(
        app, 
        allow_origin=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        allow_credentials=True
    )
    
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
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)