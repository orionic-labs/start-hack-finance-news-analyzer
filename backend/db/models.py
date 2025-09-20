from sqlalchemy import Column, String, DateTime, Numeric, String, Text, func
from sqlalchemy.orm import declarative_base, Mapped, mapped_column
from utils.helpers import utcnow
from db.types import Vector1536
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .session import Base
Base = declarative_base()


class Article(Base):
    __tablename__ = "articles"

    url = Column(String, primary_key=True, nullable=False)
    source_domain = Column(String, nullable=False)
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
class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform: Mapped[str]   = mapped_column(String(80), nullable=True)       # e.g. "twitter"
    link: Mapped[str]       = mapped_column(Text, nullable=False)            # profile/login URL
    username: Mapped[str]   = mapped_column(String(255), nullable=False)
    password_enc: Mapped[str] = mapped_column(Text, nullable=False)          # Fernet encrypted
    created_at: Mapped[str] = mapped_column(server_default=func.now())
    updated_at: Mapped[str] = mapped_column(server_default=func.now(), onupdate=func.now())
