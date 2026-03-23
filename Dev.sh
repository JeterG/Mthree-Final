#!/bin/bash

ROOT_ENV=".env"
ENV_TS="frontend/src/environments/environment.ts"

# ── Log files — append across runs ──────────────────────────────
LOG_DIR="logs"
CLOUDFLARE_LOG="$LOG_DIR/cloudflare.log"
NGROK_LOG="$LOG_DIR/ngrok.log"
DOCKER_LOG="$LOG_DIR/docker.log"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
SQL_LOG="$LOG_DIR/sql.log"
SESSION_LOG="$LOG_DIR/session.log"

CLOUDFLARE_PID=""
NGROK_PID=""
CLEANED_UP=false
RESET_DB=false

for arg in "$@"; do
    if [ "$arg" = "--reset-db" ]; then
        RESET_DB=true
    fi
done

# ── Ensure log directory exists ──────────────────────────────────
mkdir -p "$LOG_DIR"

# ── Session separator — append to existing logs ──────────────────
SESSION_START=$(date '+%Y-%m-%d %H:%M:%S')
SEPARATOR="━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for log in "$CLOUDFLARE_LOG" "$NGROK_LOG" "$DOCKER_LOG" "$BACKEND_LOG" "$FRONTEND_LOG" "$SQL_LOG"; do
    echo "" >> "$log"
    echo "$SEPARATOR" >> "$log"
    echo "SESSION START: $SESSION_START" >> "$log"
    echo "$SEPARATOR" >> "$log"
done

echo "$SESSION_START — prod.sh started" >> "$SESSION_LOG"

log_session() {
    echo "$(date '+%H:%M:%S') $*" >> "$SESSION_LOG"
}

commands() {
    echo ""
    echo "📜 Commands:"
    echo "  logs docker      — Docker compose logs"
    echo "  logs backend     — Spring Boot logs"
    echo "  logs frontend    — Angular/nginx logs"
    echo "  logs sql         — MySQL query logs"
    echo "  logs cloudflare  — Cloudflare tunnel"
    echo "  logs ngrok       — ngrok"
    echo "  logs session     — This session events"
    echo "  exit"
    echo ""
}

cleanup() {
    if [ "$CLEANED_UP" = true ]; then return; fi
    CLEANED_UP=true
    echo ""
    echo "🛑 Shutting down..."
    log_session "Shutdown initiated"
    
    for sock in "/var/run/docker.sock" "$HOME/.docker/run/docker.sock"; do
        if [ -S "$sock" ]; then export DOCKER_HOST="unix://$sock"; break; fi
    done
    
    docker compose down --timeout 10 2>/dev/null || true
    
    if [ -n "$(docker ps -q 2>/dev/null)" ]; then
        docker ps -q | xargs docker stop 2>/dev/null || true
    fi
    if [ -n "$(docker ps -aq 2>/dev/null)" ]; then
        docker ps -aq | xargs docker rm 2>/dev/null || true
    fi
    
    kill "$CLOUDFLARE_PID" "$NGROK_PID" 2>/dev/null || true
    pkill -f "cloudflared tunnel" 2>/dev/null || true
    pkill -f "ngrok http" 2>/dev/null || true
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    lsof -ti:4200 | xargs kill -9 2>/dev/null || true
    
    if [ -f "$ENV_TS" ]; then
        sed -i '' "s|apiUrl: '.*'|apiUrl: 'http://localhost:8080'|" "$ENV_TS"
        echo "♻️  environment.ts restored to localhost:8080"
    fi
    
    log_session "Shutdown complete"
    echo "🧹 Done."
    exit 0
}

trap cleanup INT TERM

# ── Docker socket ────────────────────────────────────────────────
DOCKER_FOUND=false
for sock in "/var/run/docker.sock" "$HOME/.docker/run/docker.sock" "$HOME/.docker/desktop/docker.sock"; do
    if [ -S "$sock" ]; then
        export DOCKER_HOST="unix://$sock"
        if docker info > /dev/null 2>&1; then
            DOCKER_FOUND=true
            echo "🐳 Docker is running ($sock)"
            break
        fi
    fi
done

if [ "$DOCKER_FOUND" = false ]; then
    echo "⚠️  Docker not reachable — attempting to start Docker Desktop..."
    open -a Docker 2>/dev/null || true
    for i in $(seq 1 30); do
        for sock in "/var/run/docker.sock" "$HOME/.docker/run/docker.sock"; do
            if [ -S "$sock" ]; then
                export DOCKER_HOST="unix://$sock"
                if docker info > /dev/null 2>&1; then
                    DOCKER_FOUND=true
                    echo "🐳 Docker started ($sock)"
                    break 2
                fi
            fi
        done
        printf "."
        sleep 1
    done
    echo ""
fi

if [ "$DOCKER_FOUND" = false ]; then
    echo "❌ Docker still not reachable — open Docker Desktop manually and try again"
    exit 1
fi

# ── Stop containers ──────────────────────────────────────────────
echo "🧹 Stopping any running containers..."
RUNNING=$(docker ps -q 2>/dev/null)
if [ -n "$RUNNING" ]; then echo "$RUNNING" | xargs docker stop 2>/dev/null || true; fi
ALL=$(docker ps -aq 2>/dev/null)
if [ -n "$ALL" ]; then echo "$ALL" | xargs docker rm 2>/dev/null || true; fi
echo "✅ Containers cleared"

# ── Free ports ───────────────────────────────────────────────────
echo "🧹 Freeing ports 8080 and 4200..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:4200 | xargs kill -9 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
pkill -f "ngrok http" 2>/dev/null || true
sleep 1

# ── Reset DB ─────────────────────────────────────────────────────
if [ "$RESET_DB" = true ]; then
    echo "♻️  Resetting database — removing named volume financeDb..."
    docker volume rm financeDb 2>/dev/null || echo "  (volume didn't exist, skipping)"
    log_session "--reset-db: financeDb volume wiped"
    echo "✅ Volume wiped — fresh database will be created on next start"
else
    echo "💾 Keeping existing financeDb volume (use --reset-db to wipe)"
fi

# ── Prune dangling images ────────────────────────────────────────
echo "🧹 Pruning dangling images..."
docker image prune -f 2>/dev/null || true

# ── STEP 1: Cloudflare ──────────────────────────────────────────
echo "🚀 Starting Cloudflare tunnel..."
cloudflared tunnel --url http://localhost:8080 >> "$CLOUDFLARE_LOG" 2>&1 &
CLOUDFLARE_PID=$!

echo "⏳ Waiting for Cloudflare URL..."
BACKEND_URL=""
for i in $(seq 1 30); do
    BACKEND_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' "$CLOUDFLARE_LOG" | tail -1)
    if [ -n "$BACKEND_URL" ]; then break; fi
    sleep 1
done

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Failed to get Cloudflare URL"
    cleanup
fi
echo "🌐 Cloudflare URL: $BACKEND_URL"
log_session "Cloudflare URL: $BACKEND_URL"

# ── STEP 2: Patch .env and environment.ts ───────────────────────
if grep -q "^BACKEND_URL=" "$ROOT_ENV"; then
    sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=$BACKEND_URL|" "$ROOT_ENV"
else
    echo "BACKEND_URL=$BACKEND_URL" >> "$ROOT_ENV"
fi
echo "✅ .env → BACKEND_URL=$BACKEND_URL"

if [ -f "$ENV_TS" ]; then
    sed -i '' "s|apiUrl: '.*'|apiUrl: '$BACKEND_URL'|" "$ENV_TS"
    echo "✅ environment.ts → apiUrl: '$BACKEND_URL'"
fi

# ── STEP 3: ngrok ────────────────────────────────────────────────
echo "🚀 Starting ngrok..."
ngrok http --url=unflecked-rhamnaceous-lynne.ngrok-free.dev 4200 >> "$NGROK_LOG" 2>&1 &
NGROK_PID=$!

# ── STEP 4: Docker build ─────────────────────────────────────────
echo "🐳 Building and starting Docker..."
docker compose up --build -d --remove-orphans

# Stream logs to files in background
docker compose logs -f backend 2>&1 | grep -v "^$" >> "$BACKEND_LOG" &
docker compose logs -f frontend 2>&1 | grep -v "^$" >> "$FRONTEND_LOG" &
docker compose logs -f mysql 2>&1 | grep -v "^$" >> "$SQL_LOG" &
docker compose logs -f 2>&1 | grep -v "^$" >> "$DOCKER_LOG" &

# Prune after build
docker image prune -f 2>/dev/null || true

log_session "All services started"

echo ""
echo "✅ PRODUCTION ENVIRONMENT RUNNING"
echo "🌐 Backend  (Cloudflare): $BACKEND_URL"
echo "🌐 Frontend (ngrok):      https://unflecked-rhamnaceous-lynne.ngrok-free.dev"
echo "🏠 Local frontend:        http://localhost:4200"
echo "🏠 Local backend:         http://localhost:8080"
echo "📁 Logs directory:        ./$LOG_DIR/"

commands

show_logs() {
    case "$1" in
        docker)     tail -n 100 "$DOCKER_LOG" ;;
        backend)    tail -n 100 "$BACKEND_LOG" ;;
        frontend)   tail -n 100 "$FRONTEND_LOG" ;;
        sql)        tail -n 100 "$SQL_LOG" ;;
        cloudflare) tail -n 100 "$CLOUDFLARE_LOG" ;;
        ngrok)      tail -n 100 "$NGROK_LOG" ;;
        session)    cat "$SESSION_LOG" ;;
        *)          echo "Usage: logs [docker|backend|frontend|sql|cloudflare|ngrok|session]" ;;
    esac
}

set +e
while true; do
    printf "> "
    read -r cmd arg || continue
    case "$cmd" in
        logs)   show_logs "$arg"; commands ;;
        exit)   cleanup ;;
        *)      commands ;;
    esac
done