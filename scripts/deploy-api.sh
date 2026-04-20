#!/usr/bin/env bash
# Build and deploy apps/api to Cloud Run (agaya-api service).
#
# - Uses Cloud Build (`gcloud builds submit`) so nothing is pushed from the
#   local machine.
# - Tags the image with the current short git SHA and `latest`.
# - Deploys to Cloud Run service `agaya-api` in asia-southeast1.
#
# Requirements:
#   - gcloud configured for project agaya-2026 (`agaya` configuration active).
#   - Artifact Registry repo `agaya-api` exists in asia-southeast1.
#   - APIs enabled: run, cloudbuild, artifactregistry, secretmanager.
#
# Usage:
#   scripts/deploy-api.sh                  # full: cloud build + deploy from apps/api
#   scripts/deploy-api.sh --trial          # deploy minimal zero-dep trial stub (pipeline smoke test)
#   scripts/deploy-api.sh --build-only     # build image only, skip deploy
#   scripts/deploy-api.sh --deploy-only    # redeploy `latest` without build
#   IMAGE_TAG=abcd1234 scripts/deploy-api.sh --deploy-only
#
# Environment overrides:
#   PROJECT_ID    default: agaya-2026
#   REGION        default: asia-southeast1
#   REPO          default: agaya-api
#   IMAGE_NAME    default: api
#   SERVICE       default: agaya-api
#   IMAGE_TAG     default: $(git rev-parse --short HEAD)
#
# Secret injection (future): pass SET_SECRETS="--set-secrets=..." to append.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-agaya-2026}"
REGION="${REGION:-asia-southeast1}"
REPO="${REPO:-agaya-api}"
IMAGE_NAME="${IMAGE_NAME:-api}"
SERVICE="${SERVICE:-agaya-api}"

# Resolve IMAGE_TAG — allow override, otherwise use short git SHA.
if [[ -z "${IMAGE_TAG:-}" ]]; then
  if ! IMAGE_TAG="$(git rev-parse --short HEAD 2>/dev/null)"; then
    echo "error: cannot resolve git short SHA. Pass IMAGE_TAG explicitly." >&2
    exit 1
  fi
fi

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}"

BUILD=1
DEPLOY=1
TRIAL=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --build-only) DEPLOY=0; shift ;;
    --deploy-only) BUILD=0; shift ;;
    --trial) TRIAL=1; shift ;;
    -h|--help)
      sed -n '2,30p' "$0"
      exit 0
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [[ "$TRIAL" == "1" ]]; then
  IMAGE_NAME="api-trial"
  IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}"
  BUILD_CONTEXT="scripts/trial-stub"
  BUILD_CONFIG="scripts/trial-stub/cloudbuild.yaml"
else
  BUILD_CONTEXT="."
  BUILD_CONFIG="cloudbuild.yaml"
fi

echo "==> project: ${PROJECT_ID}"
echo "==> region:  ${REGION}"
echo "==> service: ${SERVICE}"
echo "==> image:   ${IMAGE}:${IMAGE_TAG}"
if [[ "$TRIAL" == "1" ]]; then
  echo "==> mode:    trial stub (pipeline smoke test)"
fi
echo

if [[ "$BUILD" == "1" ]]; then
  echo "==> submitting Cloud Build..."
  gcloud builds submit \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --config "${BUILD_CONFIG}" \
    --substitutions="_IMAGE=${IMAGE},_IMAGE_TAG=${IMAGE_TAG}" \
    "${BUILD_CONTEXT}"
  echo "==> built ${IMAGE}:${IMAGE_TAG}"
fi

if [[ "$DEPLOY" == "1" ]]; then
  echo "==> deploying to Cloud Run: ${SERVICE}"

  # Optional secret injection (empty by default — stub server needs none).
  SET_SECRETS_ARG=()
  if [[ -n "${SET_SECRETS:-}" ]]; then
    SET_SECRETS_ARG=(--set-secrets="${SET_SECRETS}")
  fi

  gcloud run deploy "${SERVICE}" \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --image "${IMAGE}:${IMAGE_TAG}" \
    --platform managed \
    --execution-environment gen2 \
    --min-instances 0 \
    --max-instances 10 \
    --concurrency 80 \
    --cpu 1 \
    --memory 512Mi \
    --port 8080 \
    --timeout 60s \
    --allow-unauthenticated \
    "${SET_SECRETS_ARG[@]}"

  URL="$(gcloud run services describe "${SERVICE}" \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --format='value(status.url)')"

  echo
  echo "==> deployed"
  echo "    service URL: ${URL}"
  echo "    health: curl ${URL}/healthz"
fi
