#!/bin/bash

ENV_FILE=".env"

# Start cloudflared tunnel for backend in background, capture output
echo "Starting Cloudflare tunnel for backend..."
CLOUDFLARE_LOG=$(mktemp)
cloudflared tunnel --url http://localhost:8080 > "$CLOUDFLARE_LOG" 2>&1 &
CLOUDFLARE_PID=$!

# Wait for the URL to appear in the log
echo "Waiting for Cloudflare URL..."
BACKEND_URL=""
for i in $(seq 1 30); do
    BACKEND_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$CLOUDFLARE_LOG" | head -1)
    if [ -n "$BACKEND_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$BACKEND_URL" ]; then
    echo "Failed to get Cloudflare URL"
    kill $CLOUDFLARE_PID
    exit 1
fi

echo "Backend tunnel URL: $BACKEND_URL"

# Update BACKEND_URL in .env
if grep -q "^BACKEND_URL=" "$ENV_FILE"; then
    sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=$BACKEND_URL|" "$ENV_FILE"
else
    echo "BACKEND_URL=$BACKEND_URL" >> "$ENV_FILE"
fi

echo "Updated .env with: $BACKEND_URL"

# Start ngrok for frontend in background
echo "Starting ngrok tunnel for frontend..."
ngrok http --url=unflecked-rhamnaceous-lynne.ngrok-free.dev 4200 &
NGROK_PID=$!

# Now run dockerStart.sh
echo "Starting Docker..."
./dockerStart.sh "$@"

# Cleanup tunnels on exit
kill $CLOUDFLARE_PID $NGROK_PID 2>/dev/null
rm -f "$CLOUDFLARE_LOG"