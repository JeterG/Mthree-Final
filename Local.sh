#!/bin/bash

set -e

BACKEND_LOG="backend.log"
FRONTEND_LOG="frontend.log"
ENV_TS="frontend/src/environments/environment.ts"

BACKEND_PID=""
FRONTEND_PID=""
CLEANED_UP=false
RESET_DB=false

for arg in "$@"; do
    if [ "$arg" = "--reset-db" ]; then
        RESET_DB=true
    fi
done

# Cross-platform sed in-place edit
sed_inplace() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$1" "$2"
    else
        sed -i "$1" "$2"
    fi
}

commands() {
    echo ""
    echo "📜 Commands:"
    echo "  logs backend"
    echo "  logs frontend"
    echo "  exit"
    echo ""
}

cleanup() {
    if [ "$CLEANED_UP" = true ]; then return; fi
    CLEANED_UP=true
    echo ""
    echo "Shutting down..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    pkill -f "spring-boot:run" 2>/dev/null || true
    pkill -f "ng serve" 2>/dev/null || true
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    lsof -ti:4200 | xargs kill -9 2>/dev/null || true
    # Restore environment.ts
    if [ -f "$ENV_TS" ]; then
        sed_inplace "s|apiUrl: '.*'|apiUrl: 'http://localhost:8080'|" "$ENV_TS"
        echo " environment.ts restored to localhost:8080"
    fi
    echo "Done."
    exit 0
}

trap cleanup INT TERM

# Free ports
echo "Freeing ports 8080 and 4200..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:4200 | xargs kill -9 2>/dev/null || true
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "ng serve" 2>/dev/null || true
sleep 1

# Reset DB
if [ "$RESET_DB" = true ]; then
    echo "  Resetting database..."
    mysql -u root -proot -e "DROP DATABASE IF EXISTS financeDb;" 2>/dev/null || true
    echo " Database dropped — Spring Boot will recreate on startup"
fi

rm -f "$BACKEND_LOG" "$FRONTEND_LOG"

# Patch environment.ts to localhost
sed_inplace "s|apiUrl: '.*'|apiUrl: 'http://localhost:8080'|" "$ENV_TS"
echo " environment.ts → http://localhost:8080"

# Start backend with root credentials
echo " Starting backend..."
(
    cd backend
    ./mvnw spring-boot:run \
    -Dspring-boot.run.jvmArguments="-Dspring.datasource.username=root -Dspring.datasource.password=root" \
    > "../$BACKEND_LOG" 2>&1
) &
BACKEND_PID=$!

echo " Waiting for backend on :8080..."
MAX_WAIT=90
COUNT=0
until lsof -i tcp:8080 -sTCP:LISTEN > /dev/null 2>&1; do
    sleep 1
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_WAIT ]; then
        echo "❌ Backend didn't start in ${MAX_WAIT}s"
        tail -20 "$BACKEND_LOG"
        cleanup
    fi
done
echo " Backend is up"

# Start frontend
echo " Starting frontend..."
(cd frontend && ng serve > "../$FRONTEND_LOG" 2>&1) &
FRONTEND_PID=$!

echo " Waiting for frontend on :4200..."
MAX_WAIT=120
COUNT=0
until lsof -i tcp:4200 -sTCP:LISTEN > /dev/null 2>&1; do
    sleep 1
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_WAIT ]; then
        echo "❌ Frontend didn't start in ${MAX_WAIT}s"
        tail -20 "$FRONTEND_LOG"
        cleanup
    fi
done
echo " Frontend is up"

echo ""
echo " LOCAL ENVIRONMENT RUNNING"
echo " Frontend: http://localhost:4200"
echo " Backend:  http://localhost:8080"

commands

show_logs() {
    case "$1" in
        backend)  tail -n 100 "$BACKEND_LOG" ;;
        frontend) tail -n 100 "$FRONTEND_LOG" ;;
        *)        echo "Usage: logs [backend|frontend]" ;;
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