#!/bin/bash

BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"

CLEANED_UP=false

cleanup() {
    if [ "$CLEANED_UP" = true ]; then return; fi
    CLEANED_UP=true
    
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    lsof -ti:4200 | xargs kill -9 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "Done."
}
trap cleanup EXIT INT TERM

echo "Clearing ports 8080 and 4200..."
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:4200 | xargs kill -9 2>/dev/null
sleep 1

echo "Installing backend dependencies..."
cd "$BACKEND_DIR"
./mvnw dependency:resolve -q

echo "Installing frontend dependencies..."
cd "../$FRONTEND_DIR"
npm install --no-fund --no-audit

echo "Starting Spring Boot backend..."
cd "../$BACKEND_DIR"
export $(cat .env | xargs) && ./mvnw spring-boot:run &
BACKEND_PID=$!

echo "Starting Angular frontend..."
cd "../$FRONTEND_DIR"
ng serve &
FRONTEND_PID=$!

echo "Both services started."
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

wait $BACKEND_PID $FRONTEND_PID