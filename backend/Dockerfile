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
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy root node_modules (pnpm hoists; @cine-connect/shared may be symlinked)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
