#!/bin/bash

# Exit immediately if a command fails
set -e

# === CONFIGURE THESE PATHS ===
BACKEND_DIR="./backend"   # Spring Boot project directory
FRONTEND_DIR="./frontend" # Angular project directory

echo "Starting Spring Boot backend..."
cd "$BACKEND_DIR"
./mvnw spring-boot:run &
BACKEND_PID=$!

echo "Starting Angular frontend..."
cd "../$FRONTEND_DIR"
ng serve &
FRONTEND_PID=$!

echo "Both services started."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID