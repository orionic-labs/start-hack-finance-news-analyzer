# utils/helpers.py
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
import re



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


def extract_text_inside_tags(text, tag_name):
    """
    Extract content inside specified XML-style tags from text.

    Args:
        text: Text to extract from
        tag_name: Name of the tag to extract content from

    Returns:
        Extracted content or Empty String if tags not found
    """
    pattern = fr"<{tag_name}>(.*?)</{tag_name}>"
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else ""