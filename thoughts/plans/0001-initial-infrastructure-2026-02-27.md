# Initial Infrastructure Implementation Plan

## Overview

Set up a greenfield modular monolith as a spike for testing agentic AI. The monolith consists of three applications (API, Web, AI-Service) managed by pnpm workspaces + Turborepo, linted/formatted with Biome (JS/TS) and Ruff (Python), and fully Dockerized with management scripts.

## Current State Analysis

The repository is empty except for `.claude/` configuration and the PRD at `thoughts/prds/0001-initial-infrastructure.md`. Everything must be created from scratch.

## Desired End State

A fully functional monorepo where:
- `pnpm dev:docker` starts all services (PostgreSQL, API, Web, AI-Service) in Docker
- `pnpm dev:docker:stop` stops all services
- `pnpm dev:docker:rebuild` rebuilds from scratch
- The Web app renders a page that fetches data from the API via Apollo Client (GraphQL)
- The API can call the AI-Service over HTTP
- All linting (`pnpm lint`), formatting (`pnpm format`), and typechecking (`pnpm typecheck`) work across the monorepo

### Verification:
- `pnpm install` succeeds
- `pnpm lint` runs Biome on JS/TS and Ruff on Python with no errors
- `pnpm typecheck` passes for all TypeScript packages
- `pnpm dev:docker` starts all 4 services with health checks passing
- Visiting `http://localhost:3000` shows the web app
- `http://localhost:4000/graphql` serves the GraphQL playground
- `http://localhost:8000/health` returns OK from the AI service
- The web app successfully queries the API via Apollo Client

## What We're NOT Doing

- Authentication/authorization (this is a spike, security is not a priority)
- Production deployment configuration (only local Docker dev)
- Shared packages between apps (keeping it minimal)
- E2E tests or comprehensive unit tests (just basic smoke tests)
- CI/CD pipeline
- Database seeding beyond initial migration

## Implementation Approach

Build from the bottom up: monorepo tooling first, then each app individually, then Docker orchestration, then integration wiring. Each phase is independently verifiable.

---

## Phase 1: Monorepo Foundation

### Overview
Establish the root monorepo structure with pnpm workspaces, Turborepo, Biome, TypeScript config, git ignore, and Docker management scripts.

### Changes Required:

#### 1. Root package.json
**File**: `package.json`

```json
{
  "name": "agentic-ai-spike",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix",
    "format": "biome format --write .",
    "typecheck": "turbo typecheck",
    "dev:docker": "bash scripts/dev-docker.sh",
    "dev:docker:stop": "bash scripts/dev-docker-stop.sh",
    "dev:docker:rebuild": "bash scripts/dev-docker-rebuild.sh"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.0.0",
    "turbo": "^2.5.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=22.0.0"
  }
}
```

#### 2. pnpm Workspace Config
**File**: `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
```

#### 3. Turborepo Config
**File**: `turbo.json`

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/biome.json", "$TURBO_ROOT$/tsconfig.json"],
      "outputs": ["dist/**", ".output/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "tests/**", "**/*.test.ts", "**/*.spec.ts", "**/*_test.py"],
      "outputs": ["coverage/**", ".pytest_cache/**"]
    },
    "lint": {
      "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/biome.json"],
      "outputs": []
    },
    "lint:fix": {
      "inputs": ["$TURBO_DEFAULT$"],
      "outputs": [],
      "cache": false
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/tsconfig.json"],
      "outputs": []
    },
    "db:generate": {
      "outputs": ["drizzle/**"],
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

#### 4. Biome Config
**File**: `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "files": {
    "includes": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.json"],
    "ignore": [
      "**/node_modules/**",
      "**/dist/**",
      "**/.output/**",
      "**/coverage/**",
      "**/__pycache__/**",
      "**/routeTree.gen.ts",
      "apps/ai-service/**"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "warn",
        "noUnusedImports": "warn"
      },
      "style": {
        "useConst": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    }
  }
}
```

#### 5. Root TypeScript Config
**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

#### 6. Git Ignore
**File**: `.gitignore`

```
# Dependencies
node_modules/
.venv/

# Build outputs
dist/
.output/
*.pyc
__pycache__/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Turbo
.turbo/

# Test
coverage/
.pytest_cache/

# Docker
postgres_data/

# Generated
routeTree.gen.ts
```

#### 7. Environment Example
**File**: `.env.example`

```
# Database
POSTGRES_USER=spike
POSTGRES_PASSWORD=spike
POSTGRES_DB=spike_db

# AI Service
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEFAULT_MODEL=openai:gpt-4o

# Ports (optional overrides)
API_PORT=4000
WEB_PORT=3000
AI_SERVICE_PORT=8000
```

#### 8. Docker Check Script
**File**: `scripts/docker-check.sh`

```bash
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
```

#### 9. Docker Start Script
**File**: `scripts/dev-docker.sh`

```bash
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
```

#### 10. Docker Stop Script
**File**: `scripts/dev-docker-stop.sh`

```bash
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
```

#### 11. Docker Rebuild Script
**File**: `scripts/dev-docker-rebuild.sh`

```bash
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
```

#### 12. App directories
Create empty directories:
- `apps/api/`
- `apps/web/`
- `apps/ai-service/`

### Success Criteria:

#### Automated Verification:
- [x] `pnpm install` succeeds
- [x] `scripts/docker-check.sh` sources without error: `bash -n scripts/docker-check.sh`
- [x] `scripts/dev-docker.sh` sources without error: `bash -n scripts/dev-docker.sh`
- [x] `scripts/dev-docker-stop.sh` sources without error: `bash -n scripts/dev-docker-stop.sh`
- [x] `scripts/dev-docker-rebuild.sh` sources without error: `bash -n scripts/dev-docker-rebuild.sh`

#### Manual Verification:
- [ ] `pnpm install` creates `node_modules/` and `pnpm-lock.yaml`
- [ ] Directory structure looks correct

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: API Application

### Overview
Set up the GraphQL Yoga API with Pothos code-first schema, Drizzle ORM connected to PostgreSQL, and a basic health query.

### Changes Required:

#### 1. API package.json
**File**: `apps/api/package.json`

```json
{
  "name": "@spike/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --fix .",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@pothos/core": "^4.3.0",
    "@pothos/plugin-drizzle": "^0.13.0",
    "dotenv": "^16.4.0",
    "drizzle-orm": "^0.39.0",
    "graphql": "^16.10.0",
    "graphql-yoga": "^5.10.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "drizzle-kit": "^0.30.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

#### 2. API TypeScript Config
**File**: `apps/api/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["src/**/*"]
}
```

#### 3. Drizzle Config
**File**: `apps/api/drizzle.config.ts`

```typescript
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

#### 4. Database Schema
**File**: `apps/api/src/db/schema.ts`

```typescript
import { pgTable, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const agents = pgTable("agents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  model: varchar("model", { length: 100 }).notNull().default("openai:gpt-4o"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
});
```

#### 5. Database Relations
**File**: `apps/api/src/db/relations.ts`

```typescript
import { relations } from "drizzle-orm";
import { agents } from "./schema.js";

export const agentsRelations = relations(agents, () => ({}));
```

#### 6. Database Client
**File**: `apps/api/src/db/index.ts`

```typescript
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import * as dbRelations from "./relations.js";

const queryClient = postgres(process.env.DATABASE_URL!, { max: 10 });

export const db = drizzle(queryClient, { schema });

// Re-export for Pothos plugin
export const allRelations = { ...dbRelations };
```

#### 7. Database Migration Runner
**File**: `apps/api/src/db/migrate.ts`

```typescript
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });

await migrate(drizzle(migrationClient), { migrationsFolder: "./drizzle" });
await migrationClient.end();

console.log("Migrations complete");
```

#### 8. Pothos Schema Builder
**File**: `apps/api/src/schema/builder.ts`

```typescript
import SchemaBuilder from "@pothos/core";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import { db, allRelations } from "../db/index.js";
import { getTableConfig } from "drizzle-orm/pg-core";

interface PothosTypes {
  DrizzleRelations: typeof allRelations;
}

export const builder = new SchemaBuilder<PothosTypes>({
  plugins: [DrizzlePlugin],
  drizzle: {
    client: db,
    relations: allRelations,
    getTableConfig,
  },
});

// Initialize query and mutation types
builder.queryType({});
builder.mutationType({});
```

#### 9. Agent GraphQL Type & Queries
**File**: `apps/api/src/schema/agent.ts`

```typescript
import { builder } from "./builder.js";
import { agents } from "../db/schema.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";

const AgentRef = builder.drizzleObject("agents", {
  name: "Agent",
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
    description: t.field({
      type: "String",
      nullable: true,
      resolve: (agent) => agent.description,
    }),
    model: t.exposeString("model"),
    createdAt: t.field({
      type: "String",
      resolve: (agent) => agent.createdAt.toISOString(),
    }),
  }),
});

builder.queryFields((t) => ({
  health: t.field({
    type: "String",
    resolve: () => "ok",
  }),
  agents: t.field({
    type: [AgentRef],
    resolve: async () => {
      return db.select().from(agents);
    },
  }),
  agent: t.field({
    type: AgentRef,
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (_root, { id }) => {
      const results = await db.select().from(agents).where(eq(agents.id, id));
      return results[0] ?? null;
    },
  }),
}));

builder.mutationFields((t) => ({
  createAgent: t.field({
    type: AgentRef,
    args: {
      name: t.arg.string({ required: true }),
      description: t.arg.string(),
      model: t.arg.string(),
    },
    resolve: async (_root, { name, description, model }) => {
      const [agent] = await db
        .insert(agents)
        .values({
          name,
          description: description ?? null,
          model: model ?? "openai:gpt-4o",
        })
        .returning();
      return agent;
    },
  }),
}));
```

#### 10. Schema Index
**File**: `apps/api/src/schema/index.ts`

```typescript
import "./agent.js";
import { builder } from "./builder.js";

export const schema = builder.toSchema();
```

#### 11. Server Entry Point
**File**: `apps/api/src/main.ts`

```typescript
import "dotenv/config";
import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema/index.js";

const yoga = createYoga({
  schema,
  graphiql: true,
});

const server = createServer(yoga);

const port = Number(process.env.PORT) || 4000;

server.listen(port, () => {
  console.log(`API server running at http://localhost:${port}/graphql`);
});
```

#### 12. API Dockerfile
**File**: `apps/api/Dockerfile`

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @spike/api...

# Development
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
COPY tsconfig.json ./
WORKDIR /app/apps/api
ENV DATABASE_URL=""
EXPOSE 4000
CMD ["pnpm", "dev"]

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
COPY tsconfig.json ./
WORKDIR /app/apps/api
RUN pnpm build

# Production
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/drizzle ./drizzle
COPY --from=deps /app/apps/api/node_modules ./node_modules
COPY apps/api/package.json ./
EXPOSE 4000
CMD ["node", "dist/main.js"]
```

#### 13. API .env
**File**: `apps/api/.env`

```
DATABASE_URL=postgresql://spike:spike@localhost:5432/spike_db
PORT=4000
```

### Success Criteria:

#### Automated Verification:
- [x] `pnpm install` succeeds with the new api workspace
- [x] `pnpm --filter @spike/api typecheck` passes
- [x] `pnpm lint` passes

#### Manual Verification:
- [ ] With a running PostgreSQL, `pnpm --filter @spike/api db:push` creates the agents table
- [ ] `pnpm --filter @spike/api dev` starts the server and GraphQL playground is accessible at `http://localhost:4000/graphql`
- [ ] The `health` query returns `"ok"`
- [ ] `createAgent` mutation works and `agents` query returns results

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Web Application

### Overview
Set up a TanStack Start application with Apollo Client integration for SSR-capable GraphQL communication with the API.

### Changes Required:

#### 1. Web package.json
**File**: `apps/web/package.json`

```json
{
  "name": "@spike/web",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev --port 3000",
    "build": "vite build",
    "start": "node .output/server/index.mjs",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --fix ."
  },
  "dependencies": {
    "@apollo/client": "^3.12.0",
    "@apollo/client-integration-tanstack-start": "^0.5.0",
    "@tanstack/react-router": "^1.114.0",
    "@tanstack/react-start": "^1.114.0",
    "graphql": "^16.10.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vite-tsconfig-paths": "^5.1.0"
  }
}
```

**Note**: Pin `@tanstack/react-start` and `@tanstack/react-router` to the same version. Check npm for the latest compatible version at implementation time.

#### 2. Web TypeScript Config
**File**: `apps/web/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

#### 3. Vite Config
**File**: `apps/web/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart(),
    viteReact(),
  ],
});
```

#### 4. Apollo Client Setup
**File**: `apps/web/src/lib/apollo.ts`

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

export function createApolloClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: typeof window !== "undefined"
        ? (import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:4000/graphql")
        : (process.env.GRAPHQL_URL ?? "http://api:4000/graphql"),
    }),
  });
}
```

#### 5. Router Setup
**File**: `apps/web/src/router.tsx`

```typescript
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
```

#### 6. Root Route
**File**: `apps/web/src/routes/__root.tsx`

```tsx
/// <reference types="vite/client" />
import type { ReactNode } from "react";
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { ApolloProvider } from "@apollo/client";
import { createApolloClient } from "~/lib/apollo";

const apolloClient = createApolloClient();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Agentic AI Spike" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ApolloProvider client={apolloClient}>
          {children}
        </ApolloProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

#### 7. Index Route (Home Page)
**File**: `apps/web/src/routes/index.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { gql, useQuery } from "@apollo/client";

const HEALTH_QUERY = gql`
  query Health {
    health
  }
`;

const AGENTS_QUERY = gql`
  query GetAgents {
    agents {
      id
      name
      description
      model
      createdAt
    }
  }
`;

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { data: healthData, loading: healthLoading } = useQuery(HEALTH_QUERY);
  const { data: agentsData, loading: agentsLoading } = useQuery(AGENTS_QUERY);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Agentic AI Spike</h1>

      <section>
        <h2>API Status</h2>
        {healthLoading ? (
          <p>Checking API...</p>
        ) : (
          <p>API Health: <strong>{healthData?.health ?? "unknown"}</strong></p>
        )}
      </section>

      <section>
        <h2>Agents</h2>
        {agentsLoading ? (
          <p>Loading agents...</p>
        ) : agentsData?.agents?.length > 0 ? (
          <ul>
            {agentsData.agents.map((agent: { id: number; name: string; model: string }) => (
              <li key={agent.id}>
                <strong>{agent.name}</strong> ({agent.model})
              </li>
            ))}
          </ul>
        ) : (
          <p>No agents yet. Create one via the GraphQL playground at <a href="http://localhost:4000/graphql">localhost:4000/graphql</a>.</p>
        )}
      </section>
    </div>
  );
}
```

#### 8. Web Dockerfile
**File**: `apps/web/Dockerfile`

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter @spike/web...

# Development
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web
COPY tsconfig.json ./
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "dev"]

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web
COPY tsconfig.json ./
WORKDIR /app/apps/web
ARG VITE_GRAPHQL_URL=http://localhost:4000/graphql
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
RUN pnpm build

# Production
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=build /app/apps/web/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

#### 9. Web .env
**File**: `apps/web/.env`

```
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```

### Success Criteria:

#### Automated Verification:
- [x] `pnpm install` succeeds with the new web workspace
- [x] `pnpm --filter @spike/web typecheck` passes
- [x] `pnpm lint` passes

#### Manual Verification:
- [ ] `pnpm --filter @spike/web dev` starts and the page loads at `http://localhost:3000`
- [ ] The page shows "API Health: ok" when the API is also running
- [ ] The agents list renders (empty or populated)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: AI Service

### Overview
Set up a Python PydanticAI agent service with FastAPI, configured for both Anthropic and OpenAI, managed by uv.

### Changes Required:

#### 1. Python Project Config
**File**: `apps/ai-service/pyproject.toml`

```toml
[project]
name = "ai-service"
version = "0.1.0"
description = "PydanticAI agent service for agentic AI spike"
requires-python = ">=3.12"
dependencies = [
    "pydantic-ai-slim[openai,anthropic]>=1.0.0",
    "fastapi[standard]>=0.115.0",
    "pydantic-settings>=2.7.0",
    "uvicorn[standard]>=0.34.0",
    "httpx>=0.28.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.25.0",
    "ruff>=0.9.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/ai_service"]

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "UP"]

[tool.ruff.format]
quote-style = "double"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

#### 2. Python Version File
**File**: `apps/ai-service/.python-version`

```
3.12
```

#### 3. Thin package.json for Turbo
**File**: `apps/ai-service/package.json`

```json
{
  "name": "@spike/ai-service",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "uv run uvicorn ai_service.main:app --reload --host 0.0.0.0 --port 8000",
    "build": "uv run python -m compileall src",
    "test": "uv run pytest",
    "lint": "uv run ruff check . && uv run ruff format --check .",
    "lint:fix": "uv run ruff check --fix . && uv run ruff format .",
    "typecheck": "echo 'Python typecheck skipped (add mypy if needed)'"
  }
}
```

#### 4. Settings
**File**: `apps/ai-service/src/ai_service/__init__.py`

```python
```

**File**: `apps/ai-service/src/ai_service/config.py`

```python
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    openai_api_key: SecretStr | None = None
    anthropic_api_key: SecretStr | None = None
    default_model: str = "openai:gpt-4o"

    app_name: str = "AI Service"
    debug: bool = False


settings = Settings()
```

#### 5. Agent Definition
**File**: `apps/ai-service/src/ai_service/agents/__init__.py`

```python
```

**File**: `apps/ai-service/src/ai_service/agents/spike_agent.py`

```python
from pydantic import BaseModel, Field
from pydantic_ai import Agent

from ai_service.config import settings


class AgentResponse(BaseModel):
    answer: str = Field(description="The agent's response")
    confidence: float = Field(ge=0, le=1, description="Confidence score 0-1")


spike_agent = Agent(
    settings.default_model,
    output_type=AgentResponse,
    instructions=(
        "You are a helpful AI assistant for an agentic AI spike project. "
        "Answer questions concisely and provide a confidence score."
    ),
)
```

#### 6. FastAPI Application
**File**: `apps/ai-service/src/ai_service/main.py`

```python
from fastapi import FastAPI
from pydantic import BaseModel

from ai_service.agents.spike_agent import AgentResponse, spike_agent
from ai_service.config import settings

app = FastAPI(title=settings.app_name)


class QueryRequest(BaseModel):
    query: str
    model: str | None = None


class QueryResponse(BaseModel):
    answer: str
    confidence: float


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok", "service": "ai-service"}


@app.post("/api/v1/query", response_model=QueryResponse)
async def query_agent(request: QueryRequest) -> QueryResponse:
    result = await spike_agent.run(request.query)
    output: AgentResponse = result.output

    return QueryResponse(
        answer=output.answer,
        confidence=output.confidence,
    )
```

#### 7. AI Service .env
**File**: `apps/ai-service/.env`

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEFAULT_MODEL=openai:gpt-4o
```

#### 8. AI Service Dockerfile
**File**: `apps/ai-service/Dockerfile`

```dockerfile
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
```

#### 9. AI Service .dockerignore
**File**: `apps/ai-service/.dockerignore`

```
.venv/
__pycache__/
*.pyc
.pytest_cache/
.ruff_cache/
.env
tests/
```

#### 10. Generate lock file
Run `cd apps/ai-service && uv lock` to generate `uv.lock`.

### Success Criteria:

#### Automated Verification:
- [x] `cd apps/ai-service && uv sync` succeeds
- [x] `pnpm --filter @spike/ai-service lint` passes (ruff)
- [x] `bash -n scripts/docker-check.sh` still passes
- [x] `pnpm install` succeeds (recognizes the new workspace)

#### Manual Verification:
- [ ] `pnpm --filter @spike/ai-service dev` starts the FastAPI server
- [ ] `http://localhost:8000/health` returns `{"status": "ok", "service": "ai-service"}`
- [ ] `http://localhost:8000/docs` shows the FastAPI Swagger UI
- [ ] Posting to `/api/v1/query` with valid API keys returns an agent response

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Docker Compose

### Overview
Orchestrate all services (PostgreSQL, API, Web, AI-Service) with Docker Compose, including healthchecks and a dev override.

### Changes Required:

#### 1. Main Compose File
**File**: `compose.yml`

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-spike}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-spike}
      POSTGRES_DB: ${POSTGRES_DB:-spike_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-spike} -d ${POSTGRES_DB:-spike_db}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    ports:
      - "${POSTGRES_PORT:-5432}:5432"

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: development
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-spike}:${POSTGRES_PASSWORD:-spike}@postgres:5432/${POSTGRES_DB:-spike_db}
      PORT: "4000"
    ports:
      - "${API_PORT:-4000}:4000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./apps/api/src:/app/apps/api/src

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      target: development
    restart: unless-stopped
    environment:
      VITE_GRAPHQL_URL: http://localhost:${API_PORT:-4000}/graphql
      GRAPHQL_URL: http://api:4000/graphql
    ports:
      - "${WEB_PORT:-3000}:3000"
    depends_on:
      - api
    volumes:
      - ./apps/web/src:/app/apps/web/src

  ai-service:
    build:
      context: apps/ai-service
      dockerfile: Dockerfile
      target: development
    restart: unless-stopped
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
      DEFAULT_MODEL: ${DEFAULT_MODEL:-openai:gpt-4o}
    ports:
      - "${AI_SERVICE_PORT:-8000}:8000"
    volumes:
      - ./apps/ai-service/src:/app/src

volumes:
  postgres_data:
```

#### 2. Root .env for Docker
**File**: `.env`

```
POSTGRES_USER=spike
POSTGRES_PASSWORD=spike
POSTGRES_DB=spike_db

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEFAULT_MODEL=openai:gpt-4o
```

### Success Criteria:

#### Automated Verification:
- [x] `docker compose config` validates the compose file without errors

#### Manual Verification:
- [ ] `pnpm dev:docker` starts all 4 services
- [ ] `docker compose ps` shows all services running and healthy
- [ ] `http://localhost:3000` loads the web app
- [ ] `http://localhost:4000/graphql` loads the GraphQL playground
- [ ] `http://localhost:8000/health` returns ok
- [ ] PostgreSQL is accessible on port 5432
- [ ] `pnpm dev:docker:stop` stops all services
- [ ] `pnpm dev:docker:rebuild` rebuilds and restarts cleanly

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 6: Integration & Verification

### Overview
Wire the API to call the AI-Service over HTTP, and verify the full stack works end-to-end.

### Changes Required:

#### 1. AI Service Client in API
**File**: `apps/api/src/services/ai-service.ts`

```typescript
const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

interface AiQueryResult {
  answer: string;
  confidence: number;
}

export async function queryAiService(query: string): Promise<AiQueryResult> {
  const response = await fetch(`${AI_SERVICE_URL}/api/v1/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI service error ${response.status}: ${text}`);
  }

  return response.json() as Promise<AiQueryResult>;
}
```

#### 2. Add AI Query to GraphQL Schema
**File**: `apps/api/src/schema/ai.ts`

```typescript
import { builder } from "./builder.js";
import { queryAiService } from "../services/ai-service.js";

const AiResponseRef = builder.objectRef<{ answer: string; confidence: number }>("AiResponse");

builder.objectType(AiResponseRef, {
  fields: (t) => ({
    answer: t.exposeString("answer"),
    confidence: t.exposeFloat("confidence"),
  }),
});

builder.mutationFields((t) => ({
  askAi: t.field({
    type: AiResponseRef,
    args: {
      query: t.arg.string({ required: true }),
    },
    resolve: async (_root, { query }) => {
      return queryAiService(query);
    },
  }),
}));
```

#### 3. Register AI Schema
**File**: `apps/api/src/schema/index.ts` (update)

Add `import "./ai.js";` to the existing imports.

```typescript
import "./agent.js";
import "./ai.js";
import { builder } from "./builder.js";

export const schema = builder.toSchema();
```

#### 4. Add AI_SERVICE_URL to Docker Compose
Update the `api` service in `compose.yml` to include:

```yaml
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-spike}:${POSTGRES_PASSWORD:-spike}@postgres:5432/${POSTGRES_DB:-spike_db}
      PORT: "4000"
      AI_SERVICE_URL: http://ai-service:8000
```

#### 5. Update API depends_on
Update the `api` service in `compose.yml`:

```yaml
    depends_on:
      postgres:
        condition: service_healthy
      ai-service:
        condition: service_started
```

### Success Criteria:

#### Automated Verification:
- [x] `pnpm --filter @spike/api typecheck` passes
- [x] `pnpm lint` passes
- [x] `docker compose config` validates

#### Manual Verification:
- [ ] `pnpm dev:docker:rebuild` starts all services
- [ ] In the GraphQL playground, the `askAi` mutation is available
- [ ] Running `askAi(query: "What is 2+2?")` returns an AI response (requires valid API keys)
- [ ] The web app at `http://localhost:3000` shows "API Health: ok"
- [ ] All services are running: `docker compose ps`

**Implementation Note**: This is the final phase. After all verification passes, the spike infrastructure is complete and ready for experimentation.

---

## Testing Strategy

### Unit Tests:
- Not prioritized for this spike — focus is on getting the infrastructure running

### Manual Testing Steps:
1. `pnpm dev:docker` — all services start
2. Visit `http://localhost:3000` — web app loads, shows API health status
3. Visit `http://localhost:4000/graphql` — GraphQL playground works
4. Run `health` query — returns "ok"
5. Run `createAgent` mutation — creates an agent
6. Run `agents` query — lists created agents
7. Run `askAi` mutation — gets AI response (requires API keys)
8. Visit `http://localhost:8000/docs` — FastAPI docs load
9. `pnpm dev:docker:stop` — all services stop cleanly
10. `pnpm dev:docker:rebuild` — rebuilds and restarts

## Performance Considerations

None — this is a spike. Optimize later if needed.

## Migration Notes

- Initial Drizzle migration will be generated with `pnpm --filter @spike/api db:generate` after Phase 2
- For the Docker setup, `db:push` is used instead of formal migrations (simpler for a spike)

## References

- Original PRD: `thoughts/prds/0001-initial-infrastructure.md`
- PydanticAI Docs: https://ai.pydantic.dev/
- TanStack Start Docs: https://tanstack.com/start/latest
- GraphQL Yoga Docs: https://the-guild.dev/graphql/yoga-server/docs
- Pothos Docs: https://pothos-graphql.dev/
- Drizzle ORM Docs: https://orm.drizzle.team/
- Turborepo Docs: https://turborepo.dev/docs
- Biome Docs: https://biomejs.dev/
