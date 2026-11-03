#!/usr/bin/env bash
set -e

echo "Starting FINN backend..."
cd "$(dirname "$0")"

uvicorn app.main:app \
  --app-dir backend \
  --host 127.0.0.1 \
  --port 8000 &

BACKEND_PID=$!

cleanup() {
  echo "Stopping FINN..."
  kill "$BACKEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Starting FINN frontend..."
cd frontend
npm start -- -p "${PORT:-10000}" -H 0.0.0.0 &
FRONTEND_PID=$!

wait "$FRONTEND_PID"
