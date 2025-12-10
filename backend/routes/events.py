from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.config import Settings, get_settings
from backend.database import get_db
from backend.schemas import EventBatchIn, EventBatchResponse
from backend.services.ingest import process_batch

router = APIRouter(prefix="/api/v1/events", tags=["events"])


def require_api_key(request: Request, settings: Settings):
    if not settings.api_key:
        return
    header_key = request.headers.get("x-api-key")
    if header_key != settings.api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid api key")


@router.post("", response_model=EventBatchResponse)
async def ingest_events(
    payload: EventBatchIn,
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    require_api_key(request, settings)
    return process_batch(db, payload.events, request)
