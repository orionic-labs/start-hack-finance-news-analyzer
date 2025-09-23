# api/accounts.py
from quart import Blueprint, jsonify, request
from sqlalchemy import text
from db.session import SessionLocal
from pydantic import ValidationError
from datetime import datetime, timezone
import uuid
from backend.security.crypto import encrypt_secret

bp = Blueprint("accounts", __name__)


# ---- Accounts
@bp.get("/accounts/list")
async def list_accounts():
    try:
        async with SessionLocal() as session:
            query = text(
                """
                SELECT 
                    id,
                    platform,
                    link,
                    username,
                    created_at
                FROM accounts
                ORDER BY created_at DESC
            """
            )

            result = await session.execute(query)
            rows = result.mappings().all()

            accounts = []
            for row in rows:
                # Format created_at as "X hours ago"
                created_at = row.get("created_at")
                if created_at:
                    time_diff = datetime.now(timezone.utc) - created_at
                    hours_ago = int(time_diff.total_seconds() / 3600)
                    last_sync = (
                        f"{hours_ago} hours ago" if hours_ago > 0 else "Just now"
                    )
                else:
                    last_sync = "Never"

                accounts.append(
                    {
                        "id": str(row["id"]),
                        "platform": row["platform"],
                        "link": row["link"],
                        "username": row["username"],
                        "lastSync": last_sync,
                        "status": "active",  # Default status
                        "mediaSource": row["platform"],  # Use platform as media source
                    }
                )

            return jsonify(accounts)
    except Exception as e:
        print(f"Error fetching accounts: {e}")
        return jsonify({"error": str(e)}), 500


@bp.post("/accounts/delete")
async def delete_account():
    try:
        data = await request.get_json(force=True)
        account_id = data.get("id")

        if not account_id:
            return jsonify({"error": "Account ID is required"}), 400

        async with SessionLocal() as session:
            query = text(
                """
                DELETE FROM accounts 
                WHERE id = :id
                RETURNING id
            """
            )

            result = await session.execute(query, {"id": account_id})
            deleted_id = result.scalar_one_or_none()

            if not deleted_id:
                return jsonify({"error": "Account not found"}), 404

            await session.commit()

            return jsonify({"ok": True, "deleted_id": str(deleted_id)}), 200
    except Exception as e:
        print(f"Error deleting account: {e}")
        return jsonify({"error": str(e)}), 500


@bp.post("/accounts/add")
async def add_account():
    try:
        data = await request.get_json(force=True)

        # Validate required fields
        if not all(
            [
                data.get("platform"),
                data.get("link"),
                data.get("username"),
                data.get("password"),
            ]
        ):
            return (
                jsonify(
                    {"error": "Platform, link, username, and password are required"}
                ),
                400,
            )

        # Encrypt the password
        password_enc = encrypt_secret(data.get("password"))

        async with SessionLocal() as session:
            query = text(
                """
                INSERT INTO accounts 
                (id, platform, link, username, password_enc, created_at)
                VALUES (:id, :platform, :link, :username, :password_enc, :created_at)
                RETURNING id
            """
            )

            result = await session.execute(
                query,
                {
                    "id": str(uuid.uuid4()),
                    "platform": data.get("platform"),
                    "link": data.get("link"),
                    "username": data.get("username"),
                    "password_enc": password_enc,
                    "created_at": datetime.utcnow(),
                },
            )

            inserted_id = result.scalar_one()
            await session.commit()

            return jsonify({"ok": True, "id": str(inserted_id)}), 201
    except Exception as e:
        print(f"Error adding account: {e}")
        return jsonify({"error": str(e)}), 500
