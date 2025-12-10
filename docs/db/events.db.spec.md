events.db.spec (SQLite)
=======================

概览
----
- 数据文件位于 `data/events.db`，默认连接串 `sqlite:///./data/events.db`（见 `backend/config.py`）。启动时由 SQLAlchemy 模型自动创建。
- 当前仅包含 `events` 与 `sessions` 两张表，无外键、无迁移/版本表；主键均为 `INTEGER` 自增。
- 应用层写入逻辑与会话归并位于 `backend/services/ingest.py` 与 `backend/services/session.py`，下文对字段含义做了补充说明。

表：events
----------
- 用途：存储前端上报的行为事件，一行一事件。
- 列定义（实际 DDL 见 `sqlite3 data/events.db ".schema events"`）：
  - `id` `INTEGER PRIMARY KEY`
  - `event_id` `VARCHAR(64)` `UNIQUE` `NULL`：客户端幂等键；同时存在列级 `UNIQUE` 与约束 `uq_event_event_id`
  - `client_id` `VARCHAR(64)` `NOT NULL`
  - `session_id` `VARCHAR(80)` `NOT NULL`
  - `event_type` `VARCHAR(32)` `NOT NULL`：枚举 `page_view|game_start|game_end|heartbeat|custom`
  - `occurred_at` `DATETIME` `NOT NULL`：事件发生时间（UTC，无偏移）
  - `received_at` `DATETIME` `NOT NULL`：服务端接收时间；无数据库默认值，由应用层写入
  - `path` `TEXT`，`referrer` `TEXT`
  - `game_id` `VARCHAR(64)`，`game_name` `VARCHAR(128)`
  - `duration_ms` `INTEGER`：毫秒
  - `ip` `VARCHAR(64)`：来自 `request.client`
  - `user_agent` `TEXT`：原始 UA
  - `device_os` `VARCHAR(64)`，`device_os_version` `VARCHAR(64)`：由服务端根据 UA 解析出的操作系统（Windows/macOS/iOS/Android/Linux 等）及版本
  - `browser_name` `VARCHAR(64)`，`browser_version` `VARCHAR(64)`：由服务端根据 UA 解析出的浏览器（Chrome/Edge/Safari/Firefox 等）及版本
  - `metadata` `JSON`：列名为 `metadata`，模型属性为 `meta`；批量写入时验证序列化后大小不超过 `METADATA_MAX_BYTES`（默认 4096）
- 索引：`idx_events_client_time (client_id, occurred_at)`；`idx_events_type_time (event_type, occurred_at)`；`idx_events_game_time (game_id, occurred_at)`；`ix_events_session_id (session_id)`；`ix_events_client_id (client_id)`。
- 写入规则（应用层）：批量接口拒绝重复 `event_id`、超限的批量长度（`MAX_BATCH_EVENTS`，默认 100）和过大的 `metadata`。`session_id` 由会话归并逻辑推导后写入。

表：sessions
------------
- 用途：记录客户端的会话生命周期与计数。
- 列定义（实际 DDL 见 `sqlite3 data/events.db ".schema sessions"`）：
  - `id` `INTEGER PRIMARY KEY`
  - `session_id` `VARCHAR(80)` `UNIQUE` `NOT NULL`：由 `new_session_id(client_id)` 生成（`client_id` + 随机后缀）
  - `client_id` `VARCHAR(64)` `NOT NULL`
  - `started_at` `DATETIME` `NOT NULL`
  - `ended_at` `DATETIME` `NULL`：当前 ingest 流程未更新
  - `last_seen_at` `DATETIME` `NOT NULL`：在同一会话内更新为 `max(occurred_at, utcnow())`
  - `page_view_count` `INTEGER`，`game_start_count` `INTEGER`，`total_duration_ms` `INTEGER`：模型默认值为 0（DB 无默认；空值由应用层改写）
- 索引：`idx_sessions_client_time (client_id, started_at)`；`ix_sessions_client_id (client_id)`。
- 会话规则（应用层）：`session_idle_minutes`（默认 30）内继续复用最近会话并更新计数；超出空闲窗口则新建会话并重置计数。

附注
----
- 全局仅有两张表，未启用迁移或 schema 版本表，变更需手动维护 DDL 或通过 SQLAlchemy 重新建库。
- UA 解析逻辑位于 `backend/services/user_agent.py`，使用轻量字符串/正则匹配提取 OS 与浏览器的族与版本，无法识别时对应列留空。
- 需要核对实际字段或索引时，可直接运行 `sqlite3 data/events.db ".schema <table>"`。
