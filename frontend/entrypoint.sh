#!/bin/sh

# Start vite dev server in background
npm run dev -- --host &
VITE_PID=$!

# Start API poller/logger (runs in foreground so docker logs show its output)
node /app/log-api.js

# If logger exits, bring down vite
kill $VITE_PID || true
