#!/usr/bin/env bash
# Secret Manager preparation for the agaya-api Cloud Run service.
#
# This script is DOCUMENTATION / RUNBOOK. Do NOT invoke blindly.
# Review and run one block at a time.
#
# Prereqs:
#   1) `vercel env pull .env.production.local` in this repo so we have current
#      production values (user runs this; do not commit the file).
#   2) Active gcloud config = `agaya` (project agaya-2026).
#   3) secretmanager.googleapis.com enabled (already done).

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-agaya-2026}"
REGION="${REGION:-asia-northeast3}"
SERVICE="${SERVICE:-agaya-api}"
ENV_FILE="${ENV_FILE:-.env.production.local}"

# Secrets the API service will need, mapped from .env -> Secret Manager name.
# Left side: env var on Cloud Run. Right side: Secret Manager secret name.
SECRETS=(
  "GEMINI_API_KEY:gemini-api-key"
  "SUPABASE_URL:supabase-url"
  "SUPABASE_SERVICE_ROLE_KEY:supabase-service-role-key"
  "ADMIN_SESSION_SECRET:admin-session-secret"
  "CRON_SECRET:cron-secret"
  "SCHIFT_API_KEY:schift-api-key"
  "TWILIO_ACCOUNT_SID:twilio-account-sid"
  "TWILIO_AUTH_TOKEN:twilio-auth-token"
  "TWILIO_VERIFY_SERVICE_SID:twilio-verify-service-sid"
  "SOLAPI_API_KEY:solapi-api-key"
  "SOLAPI_API_SECRET:solapi-api-secret"
  "SOLAPI_SENDER_NUMBER:solapi-sender-number"
  "PHONE_DATA_SECRET:phone-data-secret"
)

########################################################################
# Step 1 — Create each secret (idempotent). Run once.
########################################################################
create_all_secrets() {
  for pair in "${SECRETS[@]}"; do
    secret="${pair##*:}"
    if gcloud secrets describe "$secret" --project="$PROJECT_ID" >/dev/null 2>&1; then
      echo "exists: $secret"
    else
      gcloud secrets create "$secret" \
        --project="$PROJECT_ID" \
        --replication-policy=automatic
      echo "created: $secret"
    fi
  done
}

########################################################################
# Step 2 — Upload values from .env.production.local (pulled via `vercel env pull`).
########################################################################
upload_values_from_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "error: $ENV_FILE not found. Run: vercel env pull $ENV_FILE" >&2
    exit 1
  fi

  # Load env file without executing (handle quoted values).
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a

  for pair in "${SECRETS[@]}"; do
    env_name="${pair%%:*}"
    secret="${pair##*:}"
    value="${!env_name:-}"
    if [[ -z "$value" ]]; then
      echo "skip (no value): $env_name"
      continue
    fi
    printf '%s' "$value" | gcloud secrets versions add "$secret" \
      --project="$PROJECT_ID" \
      --data-file=-
    echo "uploaded: $env_name -> $secret"
  done
}

########################################################################
# Step 3 — Grant Cloud Run runtime SA access to each secret.
# Cloud Run uses the compute SA by default ("$PROJECT_NUMBER-compute@developer.gserviceaccount.com").
# We'll use a dedicated runtime SA instead; adjust to your choice.
########################################################################
grant_secret_access() {
  RUNTIME_SA="${RUNTIME_SA:-agaya-api-runtime@${PROJECT_ID}.iam.gserviceaccount.com}"
  for pair in "${SECRETS[@]}"; do
    secret="${pair##*:}"
    gcloud secrets add-iam-policy-binding "$secret" \
      --project="$PROJECT_ID" \
      --member="serviceAccount:${RUNTIME_SA}" \
      --role=roles/secretmanager.secretAccessor \
      --condition=None >/dev/null
    echo "granted: ${RUNTIME_SA} -> $secret"
  done
}

########################################################################
# Step 4 — Redeploy Cloud Run with secrets bound as env vars.
# Use SET_SECRETS as argument to scripts/deploy-api.sh or pass here directly.
########################################################################
build_set_secrets_arg() {
  local args=""
  for pair in "${SECRETS[@]}"; do
    env_name="${pair%%:*}"
    secret="${pair##*:}"
    if [[ -n "$args" ]]; then args+=","; fi
    args+="${env_name}=${secret}:latest"
  done
  echo "$args"
}

deploy_with_secrets() {
  RUNTIME_SA="${RUNTIME_SA:-agaya-api-runtime@${PROJECT_ID}.iam.gserviceaccount.com}"
  SET_SECRETS="$(build_set_secrets_arg)"
  export SET_SECRETS
  # Append SA flag — deploy-api.sh currently does not expose this, so call gcloud directly.
  echo "SET_SECRETS=${SET_SECRETS}"
  echo
  echo "Run:"
  echo "  SET_SECRETS='${SET_SECRETS}' scripts/deploy-api.sh --deploy-only"
  echo "(Note: you also need to bind the runtime SA via --service-account=${RUNTIME_SA}"
  echo " once that SA exists. Extend deploy-api.sh if you want it automatic.)"
}

case "${1:-}" in
  create)   create_all_secrets ;;
  upload)   upload_values_from_env ;;
  grant)    grant_secret_access ;;
  show-set) build_set_secrets_arg ;;
  deploy)   deploy_with_secrets ;;
  all)
    create_all_secrets
    upload_values_from_env
    grant_secret_access
    deploy_with_secrets
    ;;
  *)
    cat <<'USAGE'
Usage: scripts/secrets-prep.sh <step>

Steps (run in order):
  create     Create Secret Manager entries for every env var.
  upload     Upload values from $ENV_FILE (default .env.production.local).
  grant      Grant roles/secretmanager.secretAccessor to the runtime SA
             (RUNTIME_SA env, default agaya-api-runtime@agaya-2026.iam...).
  show-set   Print the --set-secrets string for `gcloud run deploy`.
  deploy     Print the suggested redeploy command with SET_SECRETS bound.
  all        Runs create -> upload -> grant -> deploy (prints command).

Prereq:
  vercel env pull .env.production.local

Notes:
  - Create the runtime SA first if not done:
      gcloud iam service-accounts create agaya-api-runtime \
        --project=agaya-2026 --display-name="agaya-api runtime"
  - Missing values in $ENV_FILE are skipped (not overwritten with empty).
USAGE
    ;;
esac
