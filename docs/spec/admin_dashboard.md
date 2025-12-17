# Admin Dashboard & Data Monitoring Specification

## 1. Overview
This document specifies the design for a backend data monitoring website (Admin Dashboard) for the Mini Web Games platform.
The goal is to visualize user activity data stored in `events.db` and provide a secure, password-protected access point for administrators.

## 2. System Architecture

- **Frontend (Admin)**: A standalone Single Page Application (SPA) serving the admin interface.
  - **Local Port**: `8006`
  - **Technology**: HTML5, Vanilla JavaScript (ES6+), CSS3.
  - **Charting Library**: Chart.js (via CDN) for data visualization.
  - **Deployment**: Served via Nginx reverse proxy at `https://xiaoxiao.cool/admin`.

- **Backend**: Extension of the existing FastAPI application.
  - **Port**: Defaults to `8000` (or `8003` as seen in config).
  - **Responsibilities**: Authentication, Data Refinement, Serving Stats API.

- **Database**: SQLite (`data/events.db`).

## 3. Database Design

### 3.1 New Table: `users`
A new table will be added to `events.db` to manage administrator access.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique User ID |
| `username` | `VARCHAR(32)` | `UNIQUE NOT NULL` | Login username |
| `password_hash` | `VARCHAR(128)` | `NOT NULL` | Bcrypt hashed password |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Creation time |

### 3.2 Seed Data
- **Username**: `pp`
- **Password**: `1994188` (Must be hashed using bcrypt before storage)

## 4. Backend API Specification

Authenticiation will use OAuth2 with Password Flow (Bearer Token) using JWT.

### 4.1 Authentication
- **POST** `/api/token`
  - **Request**: `username`, `password` (Form Data)
  - **Response**: `{ "access_token": "...", "token_type": "bearer" }`
  - **Logic**: Verify credentials against `users` table.

- **GET** `/api/users/me`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: User details (id, username).

### 4.2 Statistics (Protected Routes)
All stats endpoints require a valid Bearer Token.

- **GET** `/api/admin/stats/main-page-visits`
  - **Query Params**: `start_date` (ISO), `end_date` (ISO), `granularity` (hour/day)
  - **Logic**: Count `page_view` events where `path='/'` or `game_id` is null within the time range. Group by time bucket.
  - **Response**: `[{ "time": "2023-10-01T10:00:00", "count": 120 }, ...]`

- **GET** `/api/admin/stats/unique-ips`
  - **Query Params**: `start_date` (ISO), `end_date` (ISO), `granularity` (hour/day)
  - **Logic**: Count `DISTINCT ip` for `page_view` events (Main Page) within the time range. Group by time bucket.
  - **Response**: `[{ "time": "2023-10-01T10:00:00", "count": 45 }, ...]`

- **GET** `/api/admin/stats/game-visits`
  - **Query Params**: `start_date` (ISO), `end_date` (ISO)
  - **Logic**: Count `game_start` events grouped by `game_id` (or `game_name`).
  - **Response**: `[{ "game_name": "Feed Fish", "count": 500 }, ...]`

- **GET** `/api/admin/stats/online`
  - **Logic**: Count unique `client_id` (or `session_id`) that have sent a `heartbeat` event in the last 5 minutes.
  - **Response**: `{ "online_count": 12 }`

## 5. Frontend Design

The admin frontend will be located in `frontend/admin/`.

### 5.1 Directory Structure
```
frontend/admin/
├── index.html      # Main entry point (Login + Dashboard container)
├── style.css       # Admin specific styles
├── app.js          # Main application logic (Routing, Auth)
├── api.js          # API client wrapper
└── components/     # UI Components (Charts, Tables)
```

### 5.2 Pages

#### 5.2.1 Login Page
- **Route**: `/login` (Logical state, not necessarily browser router if simple)
- **UI**:
  - Centered Card.
  - Inputs: Username, Password.
  - Button: "Login".
- **Behavior**:
  - On submit: POST to `/api/token`.
  - On success: Store JWT in `localStorage`, redirect to Dashboard.
  - On error: Show alert "Invalid credentials".

#### 5.2.2 Dashboard (Home)
- **Route**: `/` (Protected)
- **Layout**:
  - **Header**: Title "Admin Dashboard", "Logout" button.
  - **Controls**: Date Range Picker (Last 24h, Last 7d, Custom).
  - **Grid**:
    - **Card 1: Concurrent Online Users**
      - Big Number Display.
      - "Live" indicator.
    - **Card 2: Game Popularity**
      - Bar Chart (Horizontal).
      - Axis: Game Name vs Visit Count.
    - **Card 3: Main Page Traffic**
      - Line Chart.
      - Legend: "Total Visits".
      - X-Axis: Time, Y-Axis: Visits.
    - **Card 4: Unique Visitors**
      - Line Chart.
      - Legend: "Unique IPs".
      - X-Axis: Time, Y-Axis: IP Count.

### 5.3 Implementation Details
- **Charts**: Use `Chart.js` for rendering.
- **Routing**: Simple hash-based routing (`#login`, `#dashboard`) or state-based switching.
- **Security**:
  - If 401 Unauthorized is returned by API, clear token and redirect to Login.

## 6. Configuration & Deployment

### 6.1 Nginx Configuration
To expose the admin interface at `https://xiaoxiao.cool/admin`:

```nginx
server {
    # ...
    location /admin {
        alias /var/www/mini_web_games/frontend/admin; # Path to admin static files
        try_files $uri $uri/ /index.html;
    }
    # ...
}
```
*Note: The user request specified converting local port 8006 to the public URL. In a local dev environment, we assume a local server runs on 8006.*

### 6.2 Local Development
- **Backend Setup**:
  1. Install `passlib[bcrypt]` and `python-jose[cryptography]`.
  2. Implement backend routes.
  3. Run backend: `uvicorn backend.main:app --port 8000 --reload`.

- **Frontend Setup**:
  1. Navigate to `frontend/admin`.
  2. Run simple HTTP server on port 8006:
     `python3 -m http.server 8006` or `npx http-server -p 8006`
  3. Access `http://localhost:8006`.

## 7. Next Steps
1. **Migration**: Create specific script to add `users` table and seed the initial user.
2. **Backend**: Implement the `auth` router and `stats` endpoint logic.
3. **Frontend**: Build the HTML structure and integrate `Chart.js`.
