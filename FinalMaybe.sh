#!/bin/bash

set -e

ENV_FILE=".env"

CLOUDFLARE_LOG="cloudflare.log"
NGROK_LOG="ngrok.log"
BACKEND_LOG="backend.log"
FRONTEND_LOG="frontend.log"

CLOUDFLARE_PID=""
NGROK_PID=""
BACKEND_PID=""
FRONTEND_PID=""

CLEANED_UP=false
RESET_DB=false

# -------------------------------
# 🔧 PARSE FLAGS
# -------------------------------
for arg in "$@"; do
    if [ "$arg" = "--reset-db" ]; then
        RESET_DB=true
    fi
done

# -------------------------------
# 📜 COMMANDS HELP
# -------------------------------
commands() {
    echo "📜 Commands:"
    echo "  logs backend"
    echo "  logs frontend"
    echo "  logs cloudflare"
    echo "  logs ngrok"
    echo "  exit"
    echo ""
}

# -------------------------------
# 🧹 CLEANUP FUNCTION
# -------------------------------
cleanup() {
    if [ "$CLEANED_UP" = true ]; then
        return
    fi
    CLEANED_UP=true
    
    echo ""
    echo "🛑 Shutting everything down..."
    
    kill "$CLOUDFLARE_PID" "$NGROK_PID" "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    
    echo "🧹 Cleanup complete."
    exit 0
}

trap cleanup INT TERM

# -------------------------------
# 🔪 FREE PORTS
# -------------------------------
kill_port() {
    PORT=$1
    PID=$(lsof -ti tcp:$PORT 2>/dev/null || true)
    
    if [ -n "$PID" ]; then
        echo "⚠️ Port $PORT in use. Killing PID $PID..."
        kill -9 $PID 2>/dev/null || true
    else
        echo "✅ Port $PORT is free"
    fi
}

echo "🧹 Cleaning up ports..."
kill_port 8080
kill_port 4200

# Kill leftover processes just in case
pkill -f "cloudflared tunnel" 2>/dev/null || true
pkill -f "ngrok http" 2>/dev/null || true
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "ng serve" 2>/dev/null || true

# -------------------------------
# 🧨 RESET DATABASE (OPTIONAL)
# -------------------------------
if [ "$RESET_DB" = true ]; then
    echo "♻️ Resetting database..."
    
    rm -f backend/*.db backend/*.mv.db backend/*.trace.db 2>/dev/null || true
    
    docker compose down -v 2>/dev/null || true
    
    echo "✅ Database reset complete"
fi

# Clean logs
rm -f "$CLOUDFLARE_LOG" "$NGROK_LOG" "$BACKEND_LOG" "$FRONTEND_LOG"

# -------------------------------
# 🚀 START BACKEND
# -------------------------------
echo "🚀 Starting backend (Spring Boot)..."
(cd backend && ./mvnw spring-boot:run > "../$BACKEND_LOG" 2>&1) &
BACKEND_PID=$!

echo "⏳ Waiting for backend on :8080..."
until curl -s http://localhost:8080 > /dev/null; do
    sleep 1
done

echo "✅ Backend is up"

# -------------------------------
# 🌐 CLOUDFLARE TUNNEL
# -------------------------------
echo "🚀 Starting Cloudflare tunnel..."
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

# Update .env
if grep -q "^BACKEND_URL=" "$ENV_FILE"; then
    sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=$BACKEND_URL|" "$ENV_FILE"
else
    echo "BACKEND_URL=$BACKEND_URL" >> "$ENV_FILE"
fi

echo "✅ .env updated"

# -------------------------------
# 🚀 START FRONTEND
# -------------------------------
echo "🚀 Starting frontend (Angular)..."
(cd frontend && ng serve > "../$FRONTEND_LOG" 2>&1) &
FRONTEND_PID=$!

echo "⏳ Waiting for frontend on :4200..."
until curl -s http://localhost:4200 > /dev/null; do
    sleep 1
done

echo "✅ Frontend is up"

# -------------------------------
# 🌐 NGROK
# -------------------------------
echo "🚀 Starting ngrok tunnel..."
ngrok http --url=kathartic-rylie-intercompany.ngrok-free.dev 4200 > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!

echo ""
echo "✅ EVERYTHING IS RUNNING"
echo "🌐 Backend (Cloudflare): $BACKEND_URL"
echo "🌐 Frontend (ngrok): https://kathartic-rylie-intercompany.ngrok-free.dev"
echo "🏠 Local Frontend: http://localhost:4200"
echo "🏠 Local Backend: http://localhost:8080"
echo ""

commands

# -------------------------------
# 📜 LOG VIEWER
# -------------------------------
show_logs() {
    case "$1" in
        backend)
            tail -n 100 "$BACKEND_LOG"
        ;;
        frontend)
            tail -n 100 "$FRONTEND_LOG"
        ;;
        cloudflare)
            tail -n 100 "$CLOUDFLARE_LOG"
        ;;
        ngrok)
            tail -n 100 "$NGROK_LOG"
        ;;
        *)
            echo "Usage: logs [backend|frontend|cloudflare|ngrok]"
        ;;
    esac
}

# -------------------------------
# 🔁 INTERACTIVE LOOP
# -------------------------------
set +e
while true; do
    printf "> "
    read -r cmd arg || continue
    
    case "$cmd" in
        logs)
            show_logs "$arg"
            commands
        ;;
        exit)
            cleanup
        ;;
        *)
            commands
        ;;
    esac
done