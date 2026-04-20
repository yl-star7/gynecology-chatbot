# syntax=docker/dockerfile:1.7
# Multi-stage build for the mobile API service (monorepo-aware).
# Runs TypeScript directly via tsx so packages/mobile-api (raw .ts exports)
# can be consumed without a separate compile step.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# -------- deps: install workspace deps once --------
FROM base AS deps
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc* ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @gynecology-chatbot/api...

# -------- runtime: minimal image --------
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages ./packages
COPY pnpm-workspace.yaml package.json ./
COPY apps/api ./apps/api

EXPOSE 8080
WORKDIR /app/apps/api
CMD ["pnpm", "start"]
