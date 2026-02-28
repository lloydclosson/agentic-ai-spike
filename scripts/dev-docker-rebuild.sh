#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$REPO_ROOT/scripts/docker-check.sh"

echo "==> Checking Docker..."
ensure_docker_running

echo "==> Stopping existing services..."
cd "$REPO_ROOT"
docker compose down

echo "==> Pruning dangling images..."
docker image prune -f

echo "==> Rebuilding all images (no cache)..."
docker compose build --no-cache --parallel

echo "==> Starting services..."
docker compose up -d

echo "Rebuild complete."
