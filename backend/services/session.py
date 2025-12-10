from datetime import datetime, timedelta
from typing import Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.models import Session as SessionModel, new_session_id

settings = get_settings()


def resolve_session(db: Session, client_id: str, occurred_at: datetime) -> SessionModel:
    idle_window = timedelta(minutes=settings.session_idle_minutes)

    stmt = select(SessionModel).where(SessionModel.client_id == client_id).order_by(SessionModel.last_seen_at.desc())
    existing = db.execute(stmt).scalars().first()

    if existing and occurred_at - existing.last_seen_at <= idle_window:
        existing.last_seen_at = max(existing.last_seen_at, occurred_at)
        return existing

    sid = new_session_id(client_id)
    session = SessionModel(
        session_id=sid,
        client_id=client_id,
        started_at=occurred_at,
        last_seen_at=occurred_at,
    )
    db.add(session)
    return session


def bump_session_stats(session: SessionModel, event_type: str, duration_ms: int | None) -> None:
    if event_type == "page_view":
        session.page_view_count = (session.page_view_count or 0) + 1
    if event_type == "game_start":
        session.game_start_count = (session.game_start_count or 0) + 1
    if duration_ms:
        session.total_duration_ms = (session.total_duration_ms or 0) + duration_ms
    session.last_seen_at = max(session.last_seen_at, datetime.utcnow())
