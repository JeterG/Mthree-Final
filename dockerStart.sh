#!/bin/bash

RESET=false

if [ "$1" = "--reset" ]; then
    RESET=true
fi

cleanup() {
    echo ""
    echo "Shutting down containers..."
    docker compose down
    echo "Done."
}
trap cleanup EXIT INT TERM

if [ "$RESET" = true ]; then
    echo "Resetting database and rebuilding..."
    docker compose down -v
    docker compose up --build
else
    echo "Starting containers..."
    docker compose up --build
fi
