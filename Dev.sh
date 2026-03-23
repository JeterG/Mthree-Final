#!/bin/bash

ROOT_ENV=".env"
ENV_TS="frontend/src/environments/environment.ts"
LOG_DIR="logs"

# Log file paths
CLOUDFLARE_LOG="$LOG_DIR/cloudflare.log"
NGROK_LOG="$LOG_DIR/ngrok.log"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
SESSION_LOG="$LOG_DIR/session.log"

mkdir -p "$LOG_DIR"

# Clean up function
cleanup() {
    echo -e "\n🛑 Shutting down..."
    docker compose down 2>/dev/null
    pkill -f "cloudflared tunnel" 2>/dev/null
    pkill -f "ngrok http" 2>/dev/null
    lsof -ti:8080,4200 | xargs kill -9 2>/dev/null || true
    
    if [ -f "$ENV_TS" ]; then
        sed -i '' "s|apiUrl: '.*'|apiUrl: 'http://localhost:8080'|" "$ENV_TS"
    fi
    echo "🧹 Done."
    exit 0
}
trap cleanup INT TERM

# ── PRE-FLIGHT ──
echo "🧹 Clearing ports 8080 and 4200..."
lsof -ti:8080,4200 | xargs kill -9 2>/dev/null || true

# ── STEP 1: Start Tunnels ──
echo "🚀 Starting Cloudflare tunnel..."
cloudflared tunnel --url http://localhost:8080 > "$CLOUDFLARE_LOG" 2>&1 &
CLOUDFLARE_PID=$!

echo "🚀 Starting ngrok..."
ngrok http --url=unflecked-rhamnaceous-lynne.ngrok-free.dev 4200 > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!

echo "⏳ Waiting for URLs..."
sleep 5
BACKEND_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$CLOUDFLARE_LOG" | tail -1)
FRONTEND_URL="https://unflecked-rhamnaceous-lynne.ngrok-free.dev"

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Failed to get Cloudflare URL. Check $CLOUDFLARE_LOG";
    cleanup;
fi

# ── STEP 2: Patch Files ──
echo "🌐 Backend: $BACKEND_URL"
echo "🌐 Frontend: $FRONTEND_URL"

# Update Angular environment
if [ -f "$ENV_TS" ]; then
    sed -i '' "s|apiUrl: '.*'|apiUrl: '$BACKEND_URL'|" "$ENV_TS"
    echo "✅ environment.ts updated"
fi

# Update .env for Docker
sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=$BACKEND_URL|" "$ROOT_ENV" 2>/dev/null || echo "BACKEND_URL=$BACKEND_URL" >> "$ROOT_ENV"

# ── STEP 3: Docker Build & Logs ──
echo "🐳 Building and starting Docker..."
docker compose up --build -d

# Pipe logs to files in background
docker compose logs -f backend > "$BACKEND_LOG" 2>&1 &
docker compose logs -f frontend > "$FRONTEND_LOG" 2>&1 &

echo -e "\n✅ ALL SYSTEMS GO"
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo "--------------------------------"
echo "Commands: [logs backend | logs frontend | exit]"

# Interactive Menu
while true; do
    printf "> "
    read -r cmd arg
    case "$cmd" in
        logs)
            if [ "$arg" == "backend" ]; then tail -n 50 "$BACKEND_LOG";
                elif [ "$arg" == "frontend" ]; then tail -n 50 "$FRONTEND_LOG";
        else echo "Use: logs backend OR logs frontend"; fi
        ;;
        exit) cleanup ;;
        *) echo "Available: logs [service], exit" ;;
    esac
done