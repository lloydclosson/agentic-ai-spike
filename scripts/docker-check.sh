#!/usr/bin/env bash
set -euo pipefail

is_docker_running() {
  docker info > /dev/null 2>&1
}

ensure_docker_running() {
  if is_docker_running; then
    return 0
  fi

  echo "Docker daemon is not running."

  case "$(uname -s)" in
    Darwin)
      if [[ -d "/Applications/Docker.app" ]]; then
        echo "  Opening Docker Desktop..."
        open /Applications/Docker.app
        for i in $(seq 1 60); do
          if is_docker_running; then
            echo "  Docker is ready."
            return 0
          fi
          sleep 1
        done
        echo "ERROR: Docker Desktop did not start within 60 seconds." >&2
        return 1
      else
        echo "ERROR: Docker is not installed. Install Docker Desktop first." >&2
        return 1
      fi
      ;;
    Linux)
      echo "  Attempting to start Docker via systemctl..."
      sudo systemctl start docker
      sleep 3
      if ! is_docker_running; then
        echo "ERROR: Could not start Docker daemon." >&2
        return 1
      fi
      ;;
    *)
      echo "ERROR: Unsupported OS. Start Docker manually." >&2
      return 1
      ;;
  esac
}
