# ── Stage 1: deps ─────────────────────────────────────────────────────────── #
FROM node:24-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm@11.9.0

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/vc-sdk/package.json ./packages/vc-sdk/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 2: builder ──────────────────────────────────────────────────────── #
FROM node:24-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@11.9.0

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/vc-sdk/node_modules ./packages/vc-sdk/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY package.json pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/vc-sdk ./packages/vc-sdk
COPY apps/api ./apps/api

# Build en orden: types → vc-sdk → api
RUN pnpm --filter @signa-chain/types build && \
    pnpm --filter @signa-chain/vc-sdk build && \
    pnpm --filter @signa-chain/api build

# pnpm deploy crea un bundle standalone con deps planas (sin symlinks de workspace)
# Resuelve los problemas de MODULE_NOT_FOUND en runtime
RUN pnpm deploy --filter @signa-chain/api --prod --legacy /app/standalone

# ── Stage 3: runner ───────────────────────────────────────────────────────── #
FROM node:24-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

ENV NODE_ENV=production
ENV PORT=4000

# Bundle standalone: node_modules plano + dist/ + package.json
COPY --from=builder --chown=nestjs:nodejs /app/standalone ./

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-4000}/health || exit 1

CMD ["node", "dist/main.js"]
