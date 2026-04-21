#!/usr/bin/env bash
# Build and deploy apps/api to Cloud Run (agaya-api service).
#
# - Default path builds locally with Docker Buildx and pushes directly to
#   Artifact Registry.
# - Tags the image with the current short git SHA and `latest`, then deploys
#   the Artifact Registry `latest` tag to Cloud Run.
# - Cloud Build is still available with `--cloud-build` for remote builds.
#
# Requirements:
#   - gcloud configured for project agaya-2026 (`agaya` configuration active).
#   - Artifact Registry repo `agaya-api` exists in asia-northeast3.
#   - Docker authenticated for Artifact Registry:
#     gcloud auth configure-docker asia-southeast1-docker.pkg.dev
#   - APIs enabled: run, artifactregistry, secretmanager.
#   - Cloud Build API only needed with `--cloud-build`.
#
# Usage:
#   scripts/deploy-api.sh                  # local buildx push + deploy AR latest
#   scripts/deploy-api.sh --cloud-build    # Cloud Build + deploy AR latest
#   scripts/deploy-api.sh --trial          # deploy minimal zero-dep trial stub (pipeline smoke test)
#   scripts/deploy-api.sh --build-only     # build image only, skip deploy
#   scripts/deploy-api.sh --deploy-only    # redeploy `latest` without build
#   IMAGE_TAG=abcd1234 scripts/deploy-api.sh --deploy-only
#
# Environment overrides:
#   PROJECT_ID    default: agaya-2026
#   REGION        default: asia-northeast3
#   ARTIFACT_REGION default: asia-southeast1
#   REPO          default: agaya-api
#   IMAGE_NAME    default: api
#   SERVICE       default: agaya-api
#   IMAGE_TAG     default: $(git rev-parse --short HEAD)
#   DEPLOY_TAG    default: latest
#   PLATFORM      default: linux/amd64
#   CLOUDSQL_INSTANCE default: agaya-2026:asia-northeast3:agaya-db
#
# Secret injection (future): pass SET_SECRETS="--set-secrets=..." to append.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-agaya-2026}"
REGION="${REGION:-asia-northeast3}"
ARTIFACT_REGION="${ARTIFACT_REGION:-asia-southeast1}"
REPO="${REPO:-agaya-api}"
IMAGE_NAME="${IMAGE_NAME:-api}"
SERVICE="${SERVICE:-agaya-api}"
CLOUDSQL_INSTANCE="${CLOUDSQL_INSTANCE:-agaya-2026:asia-northeast3:agaya-db}"
DEPLOY_TAG="${DEPLOY_TAG:-latest}"
PLATFORM="${PLATFORM:-linux/amd64}"

# Resolve IMAGE_TAG — allow override, otherwise use short git SHA.
if [[ -z "${IMAGE_TAG:-}" ]]; then
  if ! IMAGE_TAG="$(git rev-parse --short HEAD 2>/dev/null)"; then
    echo "error: cannot resolve git short SHA. Pass IMAGE_TAG explicitly." >&2
    exit 1
  fi
fi

IMAGE="${ARTIFACT_REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}"

BUILD=1
DEPLOY=1
TRIAL=0
BUILD_BACKEND="${BUILD_BACKEND:-local}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --build-only) DEPLOY=0; shift ;;
    --deploy-only) BUILD=0; shift ;;
    --cloud-build) BUILD_BACKEND="cloud"; shift ;;
    --local-build) BUILD_BACKEND="local"; shift ;;
    --trial) TRIAL=1; shift ;;
    -h|--help)
      sed -n '2,36p' "$0"
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
  IMAGE="${ARTIFACT_REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}"
  BUILD_CONTEXT="scripts/trial-stub"
  DOCKERFILE="scripts/trial-stub/Dockerfile"
  BUILD_CONFIG="scripts/trial-stub/cloudbuild.yaml"
else
  BUILD_CONTEXT="."
  DOCKERFILE="apps/api/Dockerfile"
  BUILD_CONFIG="cloudbuild.yaml"
fi
DEPLOY_IMAGE="${IMAGE}:${DEPLOY_TAG}"

echo "==> project: ${PROJECT_ID}"
echo "==> region:  ${REGION}"
echo "==> artifact:${ARTIFACT_REGION}"
echo "==> service: ${SERVICE}"
echo "==> image:   ${IMAGE}:${IMAGE_TAG}"
echo "==> deploy:  ${DEPLOY_IMAGE}"
echo "==> cloudsql:${CLOUDSQL_INSTANCE}"
echo "==> backend: ${BUILD_BACKEND}"
if [[ "$BUILD_BACKEND" == "local" ]]; then
  echo "==> platform:${PLATFORM}"
fi
if [[ "$TRIAL" == "1" ]]; then
  echo "==> mode:    trial stub (pipeline smoke test)"
fi
echo

if [[ "$BUILD" == "1" ]]; then
  if [[ "$BUILD_BACKEND" == "local" ]]; then
    echo "==> building locally and pushing to Artifact Registry..."
    docker buildx build \
      --platform "${PLATFORM}" \
      --file "${DOCKERFILE}" \
      --tag "${IMAGE}:${IMAGE_TAG}" \
      --tag "${IMAGE}:latest" \
      --cache-from "type=registry,ref=${IMAGE}:buildcache" \
      --cache-to "type=registry,ref=${IMAGE}:buildcache,mode=max" \
      --push \
      "${BUILD_CONTEXT}"
  elif [[ "$BUILD_BACKEND" == "cloud" ]]; then
    echo "==> submitting Cloud Build..."
    gcloud builds submit \
      --project "${PROJECT_ID}" \
      --region "${REGION}" \
      --config "${BUILD_CONFIG}" \
      --substitutions="_IMAGE=${IMAGE},_IMAGE_TAG=${IMAGE_TAG}" \
      "${BUILD_CONTEXT}"
  else
    echo "error: unsupported build backend: ${BUILD_BACKEND}" >&2
    exit 2
  fi
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
    --image "${DEPLOY_IMAGE}" \
    --platform managed \
    --execution-environment gen2 \
    --min-instances 0 \
    --max-instances 10 \
    --concurrency 80 \
    --cpu 1 \
    --memory 512Mi \
    --port 8080 \
    --timeout 60s \
    --add-cloudsql-instances "${CLOUDSQL_INSTANCE}" \
    --allow-unauthenticated \
    "${SET_SECRETS_ARG[@]}"

  URL="$(gcloud run services describe "${SERVICE}" \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --format='value(status.url)')"

  echo
  echo "==> deployed"
  echo "    service URL: ${URL}"
  echo "    health: curl ${URL}/_health"
fi
