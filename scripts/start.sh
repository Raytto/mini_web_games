#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="mini_web_games"
PORT=8003
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Stop any existing session so we can restart cleanly.
screen -S "${SESSION_NAME}" -X quit >/dev/null 2>&1 || true

cd "${ROOT_DIR}"

# Launch a detached screen session that serves the project on PORT.
screen -dmS "${SESSION_NAME}" bash -lc "cd '${ROOT_DIR}' && python3 -m http.server ${PORT}"

echo "Screen session '${SESSION_NAME}' started on port ${PORT}"
