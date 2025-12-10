#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="mini_web_games_frontend"
PORT="${PORT:-8003}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"

# Stop any existing session so we can restart cleanly.
screen -S "${SESSION_NAME}" -X quit >/dev/null 2>&1 || true

# Ensure the port is free (old manual servers may still be running).
if lsof -ti :"${PORT}" >/dev/null 2>&1; then
  lsof -ti :"${PORT}" | xargs -r kill
fi

cd "${FRONTEND_DIR}"

# Launch a detached screen session that serves the frontend directory on PORT.
screen -dmS "${SESSION_NAME}" bash -lc "python3 -m http.server ${PORT} --directory '${FRONTEND_DIR}'"

echo "Screen session '${SESSION_NAME}' started on port ${PORT} serving ${FRONTEND_DIR}"
