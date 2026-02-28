FROM python:3.12-slim AS base
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

# Install dependencies
FROM base AS deps
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --no-install-project

# Development
FROM base AS development
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked
COPY src ./src
CMD ["uv", "run", "uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production
FROM python:3.12-slim AS production
WORKDIR /app
COPY --from=deps /app/.venv /app/.venv
COPY src ./src
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
