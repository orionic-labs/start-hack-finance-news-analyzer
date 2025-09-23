# api/clients.py
from quart import Blueprint, jsonify, request
from sqlalchemy import text
from db.session import SessionLocal
from pydantic import ValidationError
from typing import Dict, Any
from schemas import AddClientPayload, UpdatePortfolioPayload
from db.models import Client, Allocation

bp = Blueprint("clients", __name__)


def _validate(model, data):
    try:
        return model(**(data or {}))
    except ValidationError as e:
        from quart import abort

        abort(400, description=e.json())


@bp.get("/clients/list")
async def list_clients():
    """
    Returns clients with their allocations, aggregated per client.
    Shape (per client):
    {
      "id": <int>,
      "name": <str>,
      "status": <str>,
      "contact": { "name": <str|None>, "email": <str|None> },
      "contact_name": <str|None>,           # legacy convenience
      "contact_email": <str|None>,          # legacy convenience
      "portfolio": { "<asset_class>": <float>, ... }
    }
    """
    try:
        async with SessionLocal() as session:
            q = text(
                """
                SELECT
                    c.client_id,
                    c.name,
                    c.status,
                    c.contact_name,
                    c.contact_email,
                    a.asset_class,
                    a.allocation_percent
                FROM clients c
                LEFT JOIN allocations a
                  ON a.client_id = c.client_id
                ORDER BY c.client_id DESC
            """
            )
            result = await session.execute(q)
            rows = result.mappings().all()

            clients_map: Dict[int, Dict[str, Any]] = {}

            for r in rows:
                cid = r["client_id"]
                if cid not in clients_map:
                    clients_map[cid] = {
                        "id": cid,
                        "name": r["name"],
                        "status": r["status"],
                        "contact": {
                            "name": r["contact_name"],
                            "email": r["contact_email"],
                        },
                        # legacy convenience fields for existing FE code paths
                        "contact_name": r["contact_name"],
                        "contact_email": r["contact_email"],
                        "portfolio": {},
                    }
                if r["asset_class"] is not None:
                    clients_map[cid]["portfolio"][r["asset_class"]] = float(
                        r["allocation_percent"]
                    )

            return jsonify(list(clients_map.values()))
    except Exception as e:
        print(f"Error fetching clients with allocations: {e}")
        return jsonify({"error": "Failed to fetch clients"}), 500


@bp.post("/clients/add_client")
async def add_client():
    """
    Adds a new client. Body:
    {
      "name": "Acme Fund",
      "contact_name": "Jane Doe",
      "contact_email": "jane@example.com",
      "status": "active"            # optional, defaults to 'active'
    }
    Returns:
    {
      "ok": true,
      "id": <client_id>,
      "client_id": <client_id>,     # convenience for older FE
      "name": "...",
      "status": "...",
      "contact": { "name": "...", "email": "..." }
    }
    """
    payload = await _validate(AddClientPayload, await request.get_json(force=True))
    try:
        async with SessionLocal() as session:
            client = Client(
                name=payload.name,
                status=payload.status or "active",
                contact_name=payload.contact_name,
                contact_email=(
                    str(payload.contact_email) if payload.contact_email else None
                ),
            )
            session.add(client)
            await session.commit()
            # Refresh to make sure client_id is populated
            await session.refresh(client)

            return (
                jsonify(
                    {
                        "ok": True,
                        "id": client.client_id,
                        "client_id": client.client_id,  # keep both keys to avoid FE breakage
                        "name": client.name,
                        "status": client.status,
                        "contact": {
                            "name": client.contact_name,
                            "email": client.contact_email,
                        },
                    }
                ),
                201,
            )
    except Exception as e:
        print(f"Error adding client: {e}")
        return jsonify({"error": "Failed to add client"}), 500


@bp.put("/clients/<int:client_id>/portfolio")
async def update_portfolio(client_id: int):
    """
    Replaces a client's portfolio allocations.
    Body:
    {
      "portfolio": {
        "fx_usd": 20,
        "gold": 5,
        ...
      }
    }
    """
    body = await _validate(UpdatePortfolioPayload, await request.get_json(force=True))
    try:
        async with SessionLocal() as session:
            # Optional: ensure client exists
            exists = await session.execute(
                text("SELECT 1 FROM clients WHERE client_id = :cid"), {"cid": client_id}
            )
            if exists.scalar() is None:
                return jsonify({"error": "Client not found"}), 404

            # Remove old allocations
            await session.execute(
                text("DELETE FROM allocations WHERE client_id = :cid"),
                {"cid": client_id},
            )

            # Insert new allocations
            for asset_class, percent in (body.portfolio or {}).items():
                session.add(
                    Allocation(
                        client_id=client_id,
                        asset_class=asset_class,
                        allocation_percent=percent,
                    )
                )

            await session.commit()
            return jsonify({"ok": True}), 200
    except Exception as e:
        print(f"Error updating portfolio for client {client_id}: {e}")
        return jsonify({"error": "Failed to update portfolio"}), 500
