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
