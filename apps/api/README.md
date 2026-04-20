# @gynecology-chatbot/api

Hono on Node.js. Hosts mobile endpoints previously served from `apps/web/app/api/mobile/*`.

## Dev

```
pnpm --filter @gynecology-chatbot/api dev
```

## Build & run locally

```
pnpm --filter @gynecology-chatbot/api build
pnpm --filter @gynecology-chatbot/api start
```

## Deploy to Cloud Run

Region: `asia-northeast3`. See repo root `scripts/deploy-api.sh`.
