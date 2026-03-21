#!/bin/bash

set -e

RESET=false

if [ "$1" = "--reset" ]; then
    RESET=true
fi

if [ "$RESET" = true ]; then
    echo "♻️ Resetting database and rebuilding..."
    docker compose down -v
    docker compose up --build -d --remove-orphans
else
    echo "🐳 Starting containers..."
    docker compose up --build -d --remove-orphans
fi