# Build from repo root: docker build -f backend/Dockerfile .
# Multi-stage: build then run
FROM node:20-alpine AS builder

WORKDIR /app

# Monorepo: copy workspace and package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY shared ./shared
COPY backend ./backend
# Monorepo root config (shared/tsconfig.json and backend/tsconfig.json extend ../tsconfig.base.json)
COPY tsconfig.base.json ./

RUN pnpm --filter @cine-connect/shared build && pnpm --filter @cine-connect/backend build

# Production image
# pnpm keeps backend deps under backend/node_modules (symlinks into root .pnpm). Running from /app
# with only root node_modules breaks ESM resolution (e.g. reflect-metadata). Mirror the monorepo
# layout: /app/node_modules + /app/backend/{dist,node_modules,package.json} + /app/shared.
FROM node:20-alpine

WORKDIR /app/backend

ENV NODE_ENV=production

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/shared /app/shared

EXPOSE 3000

CMD ["node", "dist/index.js"]
