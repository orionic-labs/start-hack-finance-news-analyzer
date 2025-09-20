# db.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import String

load_dotenv()
engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True, pool_recycle=1800)

class Base(DeclarativeBase):
    pass

# Example model (replace with your real ones)
class Article(Base):
    __tablename__ = "articles"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    url: Mapped[str] = mapped_column(String(1024), unique=True, nullable=False)
