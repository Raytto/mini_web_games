import uuid
from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text, UniqueConstraint, Index
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def utcnow() -> datetime:
    return datetime.utcnow()


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    event_id = Column(String(64), unique=True, nullable=True)
    client_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(80), nullable=False, index=True)
    event_type = Column(String(32), nullable=False)
    occurred_at = Column(DateTime, nullable=False)
    received_at = Column(DateTime, nullable=False, default=utcnow)
    path = Column(Text, nullable=True)
    referrer = Column(Text, nullable=True)
    game_id = Column(String(64), nullable=True)
    game_name = Column(String(128), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    ip = Column(String(64), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_os = Column(String(64), nullable=True)
    device_os_version = Column(String(64), nullable=True)
    browser_name = Column(String(64), nullable=True)
    browser_version = Column(String(64), nullable=True)
    # Stored as "metadata" column; attribute name avoids SQLAlchemy reserved word.
    meta = Column("metadata", JSON, nullable=True)

    __table_args__ = (
        UniqueConstraint("event_id", name="uq_event_event_id"),
        Index("idx_events_client_time", "client_id", "occurred_at"),
        Index("idx_events_type_time", "event_type", "occurred_at"),
        Index("idx_events_game_time", "game_id", "occurred_at"),
    )


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True)
    session_id = Column(String(80), unique=True, nullable=False)
    client_id = Column(String(64), nullable=False, index=True)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    last_seen_at = Column(DateTime, nullable=False)
    page_view_count = Column(Integer, default=0)
    game_start_count = Column(Integer, default=0)
    total_duration_ms = Column(Integer, default=0)

    __table_args__ = (Index("idx_sessions_client_time", "client_id", "started_at"),)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(32), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=utcnow)


def new_session_id(client_id: str) -> str:
    suffix = uuid.uuid4().hex[:8]
    return f"{client_id}-{suffix}"
