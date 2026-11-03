#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export PATH="$DIR/bin:$PATH"

echo "=== Starting FINN Financial Investment Agent ==="
echo "1. Starting FastAPI Backend on http://127.0.0.1:8000 ..."
"$DIR/bin/python-dist/bin/python3" "$DIR/backend/run.py" &
BACKEND_PID=$!

echo "2. Starting Next.js Mobile-First Web Frontend on http://127.0.0.1:3000 ..."
cd "$DIR/frontend"
npm run start &
FRONTEND_PID=$!

cleanup() {
    echo "Stopping FINN services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait

