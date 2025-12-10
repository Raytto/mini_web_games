#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_NAME="mini_web_games_bankend"
ENV_NAME="mini_web_games"
PORT="${PORT:-8004}"
HOST="${HOST:-0.0.0.0}"

source "$(conda info --base)/etc/profile.d/conda.sh"

cd "$ROOT_DIR"

echo "Updating conda environment ${ENV_NAME}..."
conda env update -f "$ROOT_DIR/environment.yml" --prune

echo "Starting backend in screen session ${SESSION_NAME}..."
if screen -list | grep -q "\.${SESSION_NAME}"; then
  screen -S "${SESSION_NAME}" -X quit
fi

screen -dmS "${SESSION_NAME}" bash -lc "
  cd \"$ROOT_DIR\" &&
  conda activate \"$ENV_NAME\" &&
  mkdir -p data &&
  HOST=\"$HOST\" PORT=\"$PORT\" uvicorn backend.main:app --host \"$HOST\" --port \"$PORT\"
"

echo "Backend is starting inside screen session ${SESSION_NAME} on ${HOST}:${PORT}."
