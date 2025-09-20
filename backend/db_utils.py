from sqlalchemy.exc import IntegrityError
from models import SessionLocal, Article


def push_article(article_row: dict) -> None:
    """Insert a new article row into the DB."""
    session = SessionLocal()
    try:
        article = Article(**article_row)
        session.add(article)
        session.commit()
        print("Inserted:", article.url)
    except IntegrityError:
        session.rollback()
        print("Article already exists:", article_row["url"])
    finally:
        session.close()
