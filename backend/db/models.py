from sqlalchemy import Column, String, DateTime, Numeric
from sqlalchemy.orm import declarative_base
from backend.utils.helpers import utcnow
from backend.db.types import Vector1536

Base = declarative_base()


class Article(Base):
    __tablename__ = "articles"

    url = Column(String, primary_key=True, nullable=False)
    source_domain = Column(String, nullable=False)
    raw = Column(String, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(String, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=False)
    fetched_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
    )
    lang = Column(String, nullable=True)
    hash_64 = Column(Numeric, nullable=True)
    content_emb = Column(Vector1536)
    provider = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
