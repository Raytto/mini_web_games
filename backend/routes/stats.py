from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.config import Settings, get_settings
from backend.database import get_db
from backend.models import Event
from backend.schemas import StatsBucket, StatsSummary

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])


def require_api_key(request: Request, settings: Settings):
    if not settings.api_key:
        return
    header_key = request.headers.get("x-api-key")
    if header_key != settings.api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid api key")


@router.get("/summary", response_model=StatsSummary)
async def stats_summary(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    require_api_key(request, settings)

    since = datetime.utcnow() - timedelta(hours=24)

    stmt_totals = (
        select(Event.event_type, func.count())
        .where(Event.occurred_at >= since)
        .group_by(Event.event_type)
    )
    totals = [StatsBucket(event_type=row[0], count=row[1]) for row in db.execute(stmt_totals)]

    stmt_game = (
        select(Event.game_id, func.count())
        .where(Event.occurred_at >= since, Event.game_id.isnot(None))
        .group_by(Event.game_id)
    )
    per_game = [{"game_id": row[0], "count": row[1]} for row in db.execute(stmt_game)]

    return StatsSummary(window_hours=24, totals=totals, per_game=per_game)
