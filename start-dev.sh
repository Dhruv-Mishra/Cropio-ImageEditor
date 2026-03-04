#!/bin/bash
set -e

# ──────────────────────────────────────────────────
# Development start script — hot-reload for both
# ──────────────────────────────────────────────────

# Start Python backend with --reload for hot-reloading
echo "Starting crop-suggestion backend (dev mode) on port 8000…"
cd backend
python3 -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Cleanup: kill the backend when this script exits
trap "kill $BACKEND_PID 2>/dev/null; wait $BACKEND_PID 2>/dev/null" EXIT INT TERM

# Wait for the backend to become healthy (up to 30 seconds)
echo "Waiting for crop backend to be ready…"
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo "Backend ready (took ${i}s)."
    break
  fi
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Backend process died. Check backend/app.py logs." >&2
    exit 1
  fi
  sleep 1
done

# Final health check
if ! curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
  echo "WARNING: Backend did not become healthy within 30s. Starting Next.js anyway…" >&2
fi

# Start Next.js dev server (foreground, with hot-reload)
echo "Starting Next.js dev server…"
npm run dev
