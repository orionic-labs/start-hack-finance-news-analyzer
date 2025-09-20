# models.py
import os
from datetime import datetime
from sqlalchemy import create_engine, Column, String, DateTime, Numeric
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


class Article(Base):
    __tablename__ = "articles"
    url = Column(String, primary_key=True, nullable=False)
    source_domain = Column(String, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(String, nullable=False)
    published_at = Column(DateTime, nullable=False)
    fetched_at = Column(DateTime, nullable=False, default=datetime.now())
    lang = Column(String, nullable=True)
    hash_64 = Column(Numeric, nullable=True)
