from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Event, User
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/admin/stats", tags=["admin_stats"])

@router.get("/main-page-visits")
def get_main_page_visits(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    granularity: str = "hour",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not start_date:
        start_date = datetime.utcnow() - timedelta(hours=24)
    if not end_date:
        end_date = datetime.utcnow()

    # Filter for main page views (path / or null)
    # Note: Adjust logic if main page has specific path logic. 
    # Spec says: event_type page_view, path='/' or game_id is null.
    
    # SQLite date truncation is tricky. using stryftime.
    # %Y-%m-%d %H:00:00 for hour
    # %Y-%m-%d for day
    
    time_format = "%Y-%m-%d %H:00:00" if granularity == "hour" else "%Y-%m-%d"
    
    # query
    # SELECT strftime(Format, occurred_at) as time, count(*) as count 
    # FROM events WHERE ... GROUP BY time
    
    query = db.query(
        func.strftime(time_format, Event.occurred_at).label("time"),
        func.count(Event.id).label("count")
    ).filter(
        Event.event_type == "page_view",
        Event.occurred_at >= start_date,
        Event.occurred_at <= end_date,
        (Event.path == "/") | (Event.game_id == None)
    ).group_by("time").order_by("time")
    
    results = query.all()
    return [{"time": r.time, "count": r.count} for r in results]

@router.get("/unique-ips")
def get_unique_ips(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    granularity: str = "hour",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not start_date:
        start_date = datetime.utcnow() - timedelta(hours=24)
    if not end_date:
        end_date = datetime.utcnow()

    time_format = "%Y-%m-%d %H:00:00" if granularity == "hour" else "%Y-%m-%d"

    query = db.query(
        func.strftime(time_format, Event.occurred_at).label("time"),
        func.count(func.distinct(Event.ip)).label("count")
    ).filter(
        Event.event_type == "page_view",
        Event.occurred_at >= start_date,
        Event.occurred_at <= end_date,
        (Event.path == "/") | (Event.game_id == None)
    ).group_by("time").order_by("time")

    results = query.all()
    return [{"time": r.time, "count": r.count} for r in results]

@router.get("/game-visits")
def get_game_visits(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=7)
    if not end_date:
        end_date = datetime.utcnow()

    print(f"DEBUG: game-visits start={start_date} end={end_date}")
    
    query = db.query(
        Event.game_name,
        func.count(Event.id).label("count")
    ).filter(
        Event.event_type == "game_start",
        Event.occurred_at >= start_date,
        Event.occurred_at <= end_date,
        Event.game_name != None
    ).group_by(Event.game_name).order_by(func.count(Event.id).desc())

    results = query.all()
    print(f"DEBUG: game-visits query generated results: {results}")
    return [{"game_name": r.game_name, "count": r.count} for r in results]

@router.get("/online")
def get_online_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Last 5 minutes heartbeat
    threshold = datetime.utcnow() - timedelta(minutes=5)
    
    count = db.query(func.count(func.distinct(Event.client_id))).filter(
        Event.event_type == "heartbeat",
        Event.occurred_at >= threshold
    ).scalar()
    
    return {"online_count": count or 0}
