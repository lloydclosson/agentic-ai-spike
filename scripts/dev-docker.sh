#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$REPO_ROOT/scripts/docker-check.sh"

echo "==> Checking Docker..."
ensure_docker_running

echo "==> Starting development services..."
cd "$REPO_ROOT"
docker compose up -d --build

echo ""
echo "Services:"
echo "  Web:         http://localhost:${WEB_PORT:-3000}"
echo "  API:         http://localhost:${API_PORT:-4000}/graphql"
echo "  AI Service:  http://localhost:${AI_SERVICE_PORT:-8000}"
echo "  PostgreSQL:  localhost:${POSTGRES_PORT:-5432}"
echo ""
echo "Logs: docker compose logs -f [service]"
echo "Stop: pnpm dev:docker:stop"
