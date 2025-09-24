# api/reports.py
from quart import Blueprint, jsonify, make_response, request
import anyio, os, tempfile
from datetime import datetime
from backend.schemas import SendEmailRequest
from pydantic import ValidationError
from backend.utils.mail import send_email_async
from backend.scripts.general_report_generator import Customer, call_llm
from backend.scripts.render_report_pdf import render_report_pdf

bp = Blueprint("reports", __name__)


def _validate(model, data):
    try:
        return model(**(data or {}))
    except ValidationError as e:
        from quart import abort

        abort(400, description=e.json())


@bp.post("/reports/send_email")
async def send_email():
    payload = _validate(SendEmailRequest, await request.get_json(force=True))
    await send_email_async(
        to=str(payload.to),
        subject=payload.subject,
        text=payload.text,
        html=payload.html,
        cc=[str(e) for e in payload.cc],
        bcc=[str(e) for e in payload.bcc],
    )
    return jsonify({"ok": True, "message": "Email accepted for delivery"}), 202


@bp.post("/reports/download_pdf")
async def download_pdf():
    try:
        data = await request.get_json(force=True)
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

        customers = [
            Customer(
                name=c.get("name", ""),
                portfolio=c.get("portfolio", {}),
                notes=c.get("notes", ""),
            )
            for c in customers_data
        ]

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
        resp = await make_response(pdf_bytes)
        resp.headers["Content-Type"] = "application/pdf"
        resp.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.post("/reports/regenerate")
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
                notes=c.get("notes", ""),
            )
            for c in customers_data
        ]
        generated_report = await call_llm(text, customers, "gpt-4o-mini", 0.25)
        return jsonify(
            {
                "success": True,
                "generatedReport": generated_report,
                "processedAt": datetime.utcnow().isoformat(),
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
