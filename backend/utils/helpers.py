# utils/helpers.py
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional


def utcnow() -> datetime:
    """Timezone-aware UTC now."""
    return datetime.now(timezone.utc)


def to_int(val) -> Optional[int]:
    """Convert DB numeric to int safely."""
    if val is None:
        return None
    if isinstance(val, Decimal):
        return int(val)
    return int(val)
