from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.database import engine
from backend.models import Base
from backend.routes import events, health, stats, auth, admin_stats

settings = get_settings()

app = FastAPI(title="Mini Web Games Tracking", version="1.0.0")

if settings.origins_list():
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
def on_startup():
    Path("data").mkdir(exist_ok=True)
    Base.metadata.create_all(bind=engine)


app.include_router(health.router)
app.include_router(events.router)
app.include_router(stats.router)
app.include_router(auth.router)
app.include_router(admin_stats.router)


@app.get("/")
async def root():
    return {"status": "running", "app_env": settings.app_env}
