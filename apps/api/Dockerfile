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

RUN pnpm --filter @signa-chain/types build && \
    pnpm --filter @signa-chain/vc-sdk build && \
    pnpm --filter @signa-chain/api build

# ── Stage 3: runner ───────────────────────────────────────────────────────── #
FROM node:24-alpine AS runner
WORKDIR /app

# Non-root user for least privilege
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

ENV NODE_ENV=production
ENV PORT=4000

# Only copy built artifacts and production deps
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/vc-sdk/dist ./packages/vc-sdk/dist
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

USER nestjs

EXPOSE 4000

# Healthcheck — Railway uses this to determine if the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/v1/health || exit 1

CMD ["node", "dist/main.js"]
