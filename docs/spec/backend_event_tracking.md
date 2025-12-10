Backend Event Tracking Service (FastAPI + SQLite)
================================================

Context and Goal
----------------
- Add a small backend to record front-end user behavior (page visits, game entry/exit, durations, heartbeat) for the mini web games site.
- Target stack: Python 3.11+, FastAPI, SQLite, running in a Conda-managed environment with .env for configuration.
- Optimize for simplicity and self-hosting (single process, no external services), but leave room for future migration to Postgres.

Assumptions
-----------
- Front-end has no authentication; identify clients via a first-party cookie/localStorage `client_id` (UUID generated on first visit).
- Front-end can send batched events; occasional loss is acceptable but duplication should be handled idempotently when possible.
- IP address collection is allowed; retention should be bounded to reduce privacy risk.

Functional Requirements
-----------------------
- Record events:
  - `page_view`: visiting home or other pages.
  - `game_start`: user enters a game; include `game_id` and `game_name` if available.
  - `game_end`: user exits a game; include `duration_ms` and outcome if present.
  - `heartbeat`: periodic pings to extend session duration; include elapsed time since start.
- Common event fields: `client_id` (from cookie), `event_type`, `occurred_at` (client ISO timestamp), `received_at` (server), `path`, `referrer`, `ip`, `user_agent`, optional `metadata` (JSON).
- Batched ingest: accept an array of events in one request (max configurable).
- Sessionization: derive `session_id` server-side by combining `client_id` + idle timeout window (e.g., 30 minutes). Store session start/end and last activity.
- Provide health endpoint for uptime checks.
- Provide lightweight stats endpoint (optional) for quick debugging: counts per event type over the last 24h.

Non-Functional Requirements
---------------------------
- Up to tens of requests per second; single-process uvicorn is fine.
- Data durability via SQLite WAL; migrations via Alembic or SQL scripts.
- Idempotency: if client sends a `event_id` UUID, reject duplicates; otherwise rely on natural uniqueness + timestamp.
- Privacy: redact or hash IP on retention boundary; configurable retention (e.g., 90 days for raw events, 30 days for IP).
- CORS limited to known origins.
- Observability: structured JSON logs and simple metrics counters.

API Design
----------
- `POST /api/v1/events`
  - Auth: optional API key header `X-Api-Key` when configured.
  - Body: `{"events": [EventIn...]}` where `EventIn` includes:
    - `event_id` (optional UUID for idempotency), `client_id` (required), `event_type` (enum: page_view|game_start|game_end|heartbeat|custom), `occurred_at` (ISO 8601), `path`, `referrer`, `game_id` (optional), `game_name` (optional), `duration_ms` (optional), `metadata` (dict, optional, size-limited).
  - Validation: cap batch length (`MAX_BATCH_EVENTS`, default 100); cap metadata size (e.g., 4 KB).
  - Response: `{accepted: n, rejected: n, errors: [{index, reason}]}`.
- `GET /api/v1/health`
  - Returns 200 and version info.
- `GET /api/v1/stats/summary` (optional, behind API key)
  - Returns counts per `event_type` and per `game_id` for last 24h; runs lightweight SQLite queries.

Data Model (SQLite)
-------------------
- `events`
  - `id` INTEGER PRIMARY KEY
  - `event_id` TEXT UNIQUE NULL (client-provided UUID)
  - `client_id` TEXT NOT NULL
  - `session_id` TEXT NOT NULL
  - `event_type` TEXT NOT NULL
  - `occurred_at` DATETIME NOT NULL
  - `received_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  - `path` TEXT
  - `referrer` TEXT
  - `game_id` TEXT
  - `game_name` TEXT
  - `duration_ms` INTEGER
  - `ip` TEXT
  - `user_agent` TEXT
  - `metadata` JSON
  - Indexes: `idx_events_client_time` on (`client_id`, `occurred_at`); `idx_events_type_time` on (`event_type`, `occurred_at`); `idx_events_game_time` on (`game_id`, `occurred_at`).
- `sessions`
  - `id` INTEGER PRIMARY KEY
  - `session_id` TEXT UNIQUE NOT NULL
  - `client_id` TEXT NOT NULL
  - `started_at` DATETIME NOT NULL
  - `ended_at` DATETIME NULL
  - `last_seen_at` DATETIME NOT NULL
  - `page_view_count` INTEGER DEFAULT 0
  - `game_start_count` INTEGER DEFAULT 0
  - `total_duration_ms` INTEGER DEFAULT 0
  - Indexes: `idx_sessions_client_time` on (`client_id`, `started_at`).
- `schema_versions` (if not using Alembic) to track manual migrations.

Sessionization Logic
--------------------
- Idle timeout: 30 minutes by default. If a new event from the same `client_id` is >30 minutes after `last_seen_at`, start a new `session_id`.
- `session_id` is `client_id` + `-` + short random suffix generated server-side for each session start.
- On ingest:
  1) Look up the latest session for `client_id`; if within idle window, reuse; otherwise create a new session row.
  2) Update `last_seen_at`, `ended_at`, counters, and `total_duration_ms` using `duration_ms` or elapsed time from `occurred_at`.

Ingestion Workflow
------------------
- Parse and validate batch payload with Pydantic models.
- Normalize timestamps to UTC; if client clock is skewed, clamp to `received_at` when negative skew >1 day.
- Enforce batch limits and metadata size.
- For each event, resolve `session_id`, insert into `events`, update `sessions`.
- Use a single transaction per batch for atomicity.
- Respond with per-item errors on validation failures; do not fail whole batch unless DB error occurs.

Security and Privacy
--------------------
- Optional API key via header; reject requests without a valid key when configured.
- CORS: allow only known front-end origins, block all others.
- Log redaction: avoid logging full user-agent or IP in access logs; keep them only in DB.
- Retention: scheduled job (e.g., daily) to delete events older than `RETENTION_DAYS` and to null or hash IP after `IP_RETENTION_DAYS`.
- DoS protections: limit request body size, batch size, and rate-limit per IP (simple token bucket in memory).

Configuration (.env + Conda)
----------------------------
- Managed via Conda `environment.yml` including `python=3.11`, `fastapi`, `uvicorn[standard]`, `pydantic`, `sqlalchemy`, `aiosqlite`, `python-dotenv`, `alembic`, `orjson`, `httpx` (for tests), `uvloop` (optional), `loguru` or `structlog`.
- Environment variables (loaded via `.env`):
  - `APP_ENV` (dev|prod), `PORT` (default 8000), `HOST` (default 0.0.0.0)
  - `DATABASE_URL` (default `sqlite:///./data/events.db`)
  - `API_KEY` (optional)
  - `ALLOWED_ORIGINS` (comma-separated list)
  - `MAX_BATCH_EVENTS` (default 100)
  - `METADATA_MAX_BYTES` (default 4096)
  - `SESSION_IDLE_MINUTES` (default 30)
  - `RETENTION_DAYS` (default 90), `IP_RETENTION_DAYS` (default 30)
  - `LOG_LEVEL` (info|debug), `LOG_JSON` (true|false)
- Setup flow:
  1) `conda env create -f environment.yml`
  2) `conda activate mini-web-games-tracking`
  3) Create `.env` with overrides.
  4) `uvicorn app.main:app --reload` (dev) or `uvicorn app.main:app --host 0.0.0.0 --port ${PORT}` (prod).

Directory Layout (proposed)
---------------------------
- `backend/`
  - `main.py` (FastAPI app, routes)
  - `models.py` (SQLAlchemy models)
  - `schemas.py` (Pydantic models)
  - `db.py` (session/engine helpers)
  - `services/session.py` (sessionization helpers)
  - `services/ingest.py` (batch ingest and persistence)
  - `config.py` (settings via pydantic Settings)
  - `routes/events.py`, `routes/stats.py`, `routes/health.py`
  - `logging.py` (structured logging config)
  - `migrations/` (Alembic or SQL migration scripts)
- Data file stored at `data/events.db` (ensure directory exists).

Operations
----------
- Migrations: run Alembic `upgrade head` or apply SQL scripts on deploy; backup DB before migration.
- Backups: periodic copy of SQLite file; use WAL + checkpoint to reduce contention.
- Retention job: daily script to purge old data and anonymize IPs; can be run via `cron` or uvicorn background task (timed).
- Monitoring: counters for total requests, accepted/rejected events, per-event-type counts; expose `/metrics` (optional) using Prometheus format behind API key.
- Testing: integration tests posting sample batches; property tests for sessionization boundaries; DB tests on temp SQLite.

Front-end Integration Notes
---------------------------
- On first load, generate `client_id` (UUID) and store in cookie/localStorage; reuse on every event.
- Send events via `fetch` to `/api/v1/events` with small batches (e.g., flush every 5 events or 5 seconds).
- Include `event_id` UUID per event to allow de-duplication on retries.
- Send `heartbeat` while in a game every N seconds (e.g., 15–30s) to maintain accurate durations.
- On page unload, send a final `game_end` with `duration_ms` if available (may not always arrive).

Open Questions / Future Work
----------------------------
- Should we aggregate daily stats into a rollup table to speed up dashboards?
- Need a lightweight admin UI or CLI for exporting data?
- Should IP be hashed immediately with a daily salt instead of stored raw?
- Consider migrating to Postgres if concurrency or data volume grows.
