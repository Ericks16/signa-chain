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

# Keep full monorepo structure so pnpm symlinks resolve correctly at runtime.
# pnpm does NOT hoist workspace deps to root — each package's node_modules has
# symlinks into /app/node_modules/.pnpm/<pkg>/node_modules/<pkg>.
# Flattening the layout breaks those symlinks and causes MODULE_NOT_FOUND errors.
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

COPY --from=deps --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps --chown=nestjs:nodejs /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps --chown=nestjs:nodejs /app/packages/vc-sdk/node_modules ./packages/vc-sdk/node_modules

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/vc-sdk/dist ./packages/vc-sdk/dist

# package.json files are required for Node's exports field resolution
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/types/package.json ./packages/types/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/vc-sdk/package.json ./packages/vc-sdk/package.json

USER nestjs

EXPOSE 4000

# Healthcheck — Railway uses this to determine if the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/v1/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
