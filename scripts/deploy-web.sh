#!/usr/bin/env bash
# Build and deploy apps/web (Next.js admin + mobile web) to Cloud Run (agaya-web).
#
# Mirrors scripts/deploy-api.sh structure. Uses the repo-root Dockerfile which
# already targets @gynecology-chatbot/web via `turbo prune`.
#
# Usage:
#   scripts/deploy-web.sh                  # local buildx push + deploy AR latest
#   scripts/deploy-web.sh --build-only
#   scripts/deploy-web.sh --deploy-only
#   IMAGE_TAG=codex-web-20260424120000 scripts/deploy-web.sh --deploy-only
#
# Env overrides:
#   PROJECT_ID       default: agaya-2026
#   REGION           default: asia-northeast3
#   ARTIFACT_REGION  default: asia-southeast1
#   REPO             default: agaya-api
#   IMAGE_NAME       default: web
#   SERVICE          default: agaya-web
#   IMAGE_TAG        default: codex-web-$(date +%Y%m%d%H%M%S)
#   PLATFORM         default: linux/amd64

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-agaya-2026}"
REGION="${REGION:-asia-northeast3}"
ARTIFACT_REGION="${ARTIFACT_REGION:-asia-southeast1}"
REPO="${REPO:-agaya-api}"
IMAGE_NAME="${IMAGE_NAME:-web}"
SERVICE="${SERVICE:-agaya-web}"
PLATFORM="${PLATFORM:-linux/amd64}"

IMAGE_TAG="${IMAGE_TAG:-codex-web-$(date +%Y%m%d%H%M%S)}"
IMAGE="${ARTIFACT_REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}"

BUILD=1
DEPLOY=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --build-only) DEPLOY=0; shift ;;
    --deploy-only) BUILD=0; shift ;;
    -h|--help) sed -n '2,25p' "$0"; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> project: ${PROJECT_ID}"
echo "==> service: ${SERVICE} (${REGION})"
echo "==> image:   ${IMAGE}:${IMAGE_TAG}"
echo

if [[ "$BUILD" == "1" ]]; then
  echo "==> building locally and pushing to Artifact Registry..."
  docker buildx build \
    --platform "${PLATFORM}" \
    --file "Dockerfile" \
    --tag "${IMAGE}:${IMAGE_TAG}" \
    --tag "${IMAGE}:latest" \
    --cache-from "type=registry,ref=${IMAGE}:buildcache" \
    --cache-to "type=registry,ref=${IMAGE}:buildcache,mode=max" \
    --push \
    "."
  echo "==> built ${IMAGE}:${IMAGE_TAG}"
fi

if [[ "$DEPLOY" == "1" ]]; then
  DEPLOY_IMAGE="${IMAGE}:${IMAGE_TAG}"
  echo "==> deploying to Cloud Run: ${SERVICE}"
  gcloud run deploy "${SERVICE}" \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --image "${DEPLOY_IMAGE}" \
    --platform managed

  URL="$(gcloud run services describe "${SERVICE}" \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --format='value(status.url)')"

  echo
  echo "==> deployed"
  echo "    service URL: ${URL}"
fi
