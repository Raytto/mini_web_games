# Mini Web Games

Welcome to the **Mini Web Games** project! This repository contains a collection of simple, interactive web-based mini-games, paired with a FastAPI backend for event tracking and analytics.

## 📂 Project Structure

- **`frontend/`**: Contains the source code for the mini-games.
    - **`games/`**: Individual directories for each mini-game (e.g., Feed Fish, Magic Doodle, Animal Tap).
    - **`index.html`**: The main landing page listing all available games.
    - **`scripts/`**: Frontend-specific utility scripts.
- **`backend/`**: A Python FastAPI application that provides APIs for game event tracking and statistics.
    - **`main.py`**: Entry point for the backend application.
    - **`environment.yml`**: Conda environment specification.
- **`scripts/`**: Shell scripts to easily start and manage the application services.
- **`data/`**: Directory where the backend stores its SQLite database (locally).
- **`log/`**: Application logs.
- **`admin-frontend/`**: Placeholder for a future administrative dashboard.

## 🎮 Available Games

The project includes several fun mini-games found in `frontend/games/`, including but not limited to:
- **Feed Fish**: Feed various fish in a tank.
- **Magic Doodle**: A creative drawing tool with particle effects.
- **Feed Ants**: Interact with ants and food items.
- **Animal Tap**: Tap animals to hear their sounds.
- **Car Track**: A car racing/tracking game.
- **Balloon Pop**, **Bubble Pop**, **Egg Hatch**, **Fruit Slice**, **Monster Transform**, **Time Magic**, **Feed Animal**.

## 🚀 Getting Started

### Prerequisites
- **Conda**: Required to manage the backend Python environment.
- **Python 3**: Required to serve the frontend (via `http.server`).

### Running the Project

We provide helper scripts to start the backend and frontend services quickly.

#### 1. Start the Backend
The backend handles data persistence and analytics APIs. It runs on port **8004** by default.

```bash
# Finds and updates the conda environment, then starts the server in a screen session
./scripts/start-bankend.sh
```

#### 2. Start the Frontend
The frontend serves the games and the main menu. It runs on port **8003** by default.

```bash
# Starts a simple Python HTTP server in a screen session
./scripts/start-frontend.sh
```

### Accessing the Application

Once both scripts are running:
- Open your browser and navigate to: **[http://localhost:8003](http://localhost:8003)**
- You will see the main hub with links to all the mini-games.

## 🛠️ Development

- **Logs**: Backend logs are located in `log/server.log`.
- **Environment**: The backend environment is defined in `backend/environment.yml`. If you make changes to dependencies, the start script will automatically try to update the environment.
- **Database**: The application uses SQLite, storing data in `data/events.db`.

## 📝 Admin
There is a placeholder for an Admin Frontend in `admin-frontend/`, which is intended for future development of a dashboard to view game statistics and manage data.
