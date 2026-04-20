# Self-contained trial stub for verifying the Cloud Build + Cloud Run
# pipeline end-to-end without depending on the in-flight apps/api code.
#
# Built and deployed by scripts/deploy-api.sh when invoked with --trial.
# Produces a container that exposes:
#   GET  /healthz        -> {"ok":true}
#
# This image is NOT intended for production. Once apps/api stabilizes,
# the production path (apps/api/Dockerfile via cloudbuild.yaml) supersedes
# this trial stub.

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY server.mjs ./server.mjs

EXPOSE 8080
CMD ["node", "server.mjs"]
