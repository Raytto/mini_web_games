from datetime import datetime, timezone
from typing import Iterable, List

import orjson
from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.models import Event
from backend.schemas import EventBatchResponse, EventError, EventIn
from backend.services.session import bump_session_stats, resolve_session
from backend.services.user_agent import parse_user_agent

settings = get_settings()


def normalize_ts(dt: datetime) -> datetime:
    if dt.tzinfo:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def validate_metadata_size(metadata) -> bool:
    if metadata is None:
        return True
    try:
        return len(orjson.dumps(metadata)) <= settings.metadata_max_bytes
    except Exception:
        return False


def process_batch(db: Session, events: Iterable[EventIn], request: Request) -> EventBatchResponse:
    events = list(events)
    if len(events) > settings.max_batch_events:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Too many events in batch, max is {settings.max_batch_events}",
        )

    errors: List[EventError] = []
    accepted = 0

    for idx, payload in enumerate(events):
        if not validate_metadata_size(payload.metadata):
            errors.append(EventError(index=idx, reason="metadata too large or not serializable"))
            continue

        occurred_at = normalize_ts(payload.occurred_at)

        if payload.event_id:
            existing = db.execute(select(Event).where(Event.event_id == payload.event_id)).scalar_one_or_none()
            if existing:
                errors.append(EventError(index=idx, reason="duplicate event_id"))
                continue

        try:
            with db.begin_nested():
                session = resolve_session(db, payload.client_id, occurred_at)
                duration_ms = payload.duration_ms

                ua_raw = request.headers.get("user-agent")
                ua_info = parse_user_agent(ua_raw)
                event = Event(
                    event_id=payload.event_id,
                    client_id=payload.client_id,
                    session_id=session.session_id,
                    event_type=payload.event_type,
                    occurred_at=occurred_at,
                    received_at=datetime.utcnow(),
                    path=payload.path,
                    referrer=payload.referrer,
                    game_id=payload.game_id,
                    game_name=payload.game_name,
                    duration_ms=duration_ms,
                    ip=request.client.host if request.client else None,
                    user_agent=ua_raw,
                    device_os=ua_info.device_os,
                    device_os_version=ua_info.device_os_version,
                    browser_name=ua_info.browser_name,
                    browser_version=ua_info.browser_version,
                    meta=payload.metadata,
                )

                db.add(event)
                bump_session_stats(session, payload.event_type, duration_ms)
            accepted += 1
        except IntegrityError:
            errors.append(EventError(index=idx, reason="db integrity error"))

    db.commit()
    return EventBatchResponse(accepted=accepted, rejected=len(errors), errors=errors)
