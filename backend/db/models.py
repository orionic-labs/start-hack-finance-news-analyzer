from sqlalchemy import Column, String, DateTime, Numeric, Boolean
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid
from utils.helpers import utcnow
from db.types import Vector1536

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

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform = Column(String, nullable=False)
    link = Column(String, nullable=False)
    username = Column(String, nullable=False)
    password_enc = Column(String, nullable=False)  # encrypted passwor

class Source(Base):
    __tablename__ = "sources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False, unique=True)
    category = Column(String, nullable=True)
    description = Column(String, nullable=True)
    status = Column(String, default="active")
    last_update = Column(DateTime(timezone=True), nullable=True)
    articles_per_day = Column(Numeric, nullable=True)
    reliability = Column(Numeric, nullable=True)
    keywords = Column(String, nullable=True)  # Store as JSON string
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)