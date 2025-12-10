from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

from backend.config import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args, future=True)
SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
