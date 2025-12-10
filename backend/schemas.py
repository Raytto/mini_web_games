from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, validator

EventType = Literal["page_view", "game_start", "game_end", "heartbeat", "custom"]


class EventIn(BaseModel):
    event_id: Optional[str] = Field(None, description="Client-provided UUID for idempotency")
    client_id: str = Field(..., min_length=1, description="Anonymous client identifier")
    event_type: EventType
    occurred_at: datetime
    path: Optional[str] = None
    referrer: Optional[str] = None
    game_id: Optional[str] = None
    game_name: Optional[str] = None
    duration_ms: Optional[int] = Field(None, ge=0)
    metadata: Optional[Dict[str, Any]] = None

    @validator("client_id")
    def trim_client_id(cls, v: str) -> str:
        return v.strip()


class EventBatchIn(BaseModel):
    events: List[EventIn]


class EventError(BaseModel):
    index: int
    reason: str


class EventBatchResponse(BaseModel):
    accepted: int
    rejected: int
    errors: List[EventError] = []


class StatsBucket(BaseModel):
    event_type: str
    count: int


class StatsSummary(BaseModel):
    window_hours: int = 24
    totals: List[StatsBucket]
    per_game: List[Dict[str, Any]]
