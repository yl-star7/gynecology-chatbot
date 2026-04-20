# syntax=docker/dockerfile:1.7
# Multi-stage build for the mobile API service (monorepo-aware)

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

# -------- build: transpile api --------
FROM deps AS build
WORKDIR /repo

COPY apps/api ./apps/api
RUN pnpm --filter @gynecology-chatbot/api build

# -------- runtime: minimal image --------
FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages

EXPOSE 8080
CMD ["node", "dist/server.js"]
