#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$REPO_ROOT/scripts/docker-check.sh"

if ! is_docker_running; then
  echo "Docker daemon is not running — nothing to stop."
  exit 0
fi

echo "==> Stopping development services..."
cd "$REPO_ROOT"
docker compose down

echo "Services stopped. Volumes preserved."
echo "To remove volumes: docker compose down -v"
