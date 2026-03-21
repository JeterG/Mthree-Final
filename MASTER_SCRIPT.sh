#!/bin/bash

set -e

ENV_FILE=".env"

CLOUDFLARE_LOG="cloudflare.log"
NGROK_LOG="ngrok.log"

CLOUDFLARE_PID=""
NGROK_PID=""

CLEANED_UP=false

cleanup() {
    if [ "$CLEANED_UP" = true ]; then
        return
    fi
    CLEANED_UP=true
    
    echo ""
    echo "🛑 Shutting everything down..."
    
    # Stop Docker
    docker compose down 2>/dev/null || true
    
    # Kill tunnels
    kill "$CLOUDFLARE_PID" "$NGROK_PID" 2>/dev/null || true
    
    echo "🧹 Cleanup complete."
    exit 0
}

trap cleanup INT TERM

# Clean old logs (optional but recommended)
rm -f "$CLOUDFLARE_LOG" "$NGROK_LOG"

echo "🚀 Starting Cloudflare tunnel for backend..."
cloudflared tunnel --url http://localhost:8080 > "$CLOUDFLARE_LOG" 2>&1 &
CLOUDFLARE_PID=$!

echo "⏳ Waiting for Cloudflare URL..."
BACKEND_URL=""

for i in $(seq 1 30); do
    BACKEND_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$CLOUDFLARE_LOG" | head -1)
    if [ -n "$BACKEND_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Failed to get Cloudflare URL"
    cleanup
fi

echo "🌐 Backend tunnel: $BACKEND_URL"

# Update .env (macOS-compatible)
if grep -q "^BACKEND_URL=" "$ENV_FILE"; then
    sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=$BACKEND_URL|" "$ENV_FILE"
else
    echo "BACKEND_URL=$BACKEND_URL" >> "$ENV_FILE"
fi

echo "✅ .env updated"

echo "🚀 Starting ngrok tunnel for frontend..."
ngrok http --url=unflecked-rhamnaceous-lynne.ngrok-free.dev 4200 > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!

echo "🐳 Starting Docker (detached)..."
./dockerStart.sh "$@"

echo ""
echo "✅ Everything is running!"
echo "🌐 Backend: $BACKEND_URL"
echo ""
echo "📜 Commands:"
echo "  logs docker"
echo "  logs backend"
echo "  logs frontend"
echo "  exit"
echo ""
echo "🛑 Press Ctrl+C anytime to stop everything"
echo ""

# -------- LOG VIEWER --------

show_logs() {
    target="$1"
    
    echo "📜 Opening $target logs (Ctrl+C then 'q' to exit)..."
    
    case "$target" in
        docker)
            docker compose logs --tail=100 -f | less +F
        ;;
        backend)
            tail -n 100 -f "$CLOUDFLARE_LOG" | less +F
        ;;
        frontend)
            tail -n 100 -f "$NGROK_LOG" | less +F
        ;;
        *)
            echo "Usage: logs [docker|backend|frontend]"
        ;;
    esac
}

# -------- INTERACTIVE LOOP --------

while true; do
    printf "> "
    read -r cmd arg
    
    case "$cmd" in
        logs)
            if [ -z "$arg" ]; then
                echo "Usage: logs [docker|backend|frontend]"
            else
                show_logs "$arg"
            fi
        ;;
        exit)
            cleanup
        ;;
        *)
            echo "Commands:"
            echo "  logs docker"
            echo "  logs backend"
            echo "  logs frontend"
            echo "  exit"
        ;;
    esac
done