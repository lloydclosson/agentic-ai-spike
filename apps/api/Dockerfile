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
