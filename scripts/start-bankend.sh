#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_NAME="mini_web_games_bankend"
ENV_NAME="mini_web_games"
PORT="${PORT:-8004}"
HOST="${HOST:-0.0.0.0}"
BACKEND_DIR="${ROOT_DIR}/backend"
ENV_FILE="${BACKEND_DIR}/environment.yml"
LOG_DIR="${ROOT_DIR}/log"
LOG_FILE="${LOG_DIR}/server.log"
LOG_CONFIG="${BACKEND_DIR}/logging.ini"
CONDA_BASE="$(conda info --base)"

source "${CONDA_BASE}/etc/profile.d/conda.sh"

cd "$ROOT_DIR"

echo "Updating conda environment ${ENV_NAME}..."
conda env update -f "$ENV_FILE" --prune

echo "Starting backend in screen session ${SESSION_NAME}..."
if screen -list | grep -q "\.${SESSION_NAME}"; then
  screen -S "${SESSION_NAME}" -X quit
fi

screen -dmS "${SESSION_NAME}" bash -lc "
  source \"${CONDA_BASE}/etc/profile.d/conda.sh\" &&
  conda activate \"$ENV_NAME\" &&
  cd \"$ROOT_DIR\" &&
  mkdir -p data \"$LOG_DIR\" &&
  echo \"=== Starting backend at \$(date -Is) on ${HOST}:${PORT} ===\" >> \"$LOG_FILE\" &&
  HOST=\"$HOST\" PORT=\"$PORT\" PYTHONPATH=\"$ROOT_DIR\" uvicorn backend.main:app --host \"$HOST\" --port \"$PORT\" --log-config \"$LOG_CONFIG\" >> \"$LOG_FILE\" 2>&1
"

echo "Backend is starting inside screen session ${SESSION_NAME} on ${HOST}:${PORT}."
