#!/usr/bin/env bash
# VM startup script: pg_dump from Supabase -> restore to Cloud SQL -> log to GCS -> self-destruct.
# Metadata keys used (set via --metadata):
#   supa_url  — Supabase pooler DSN
#   csql_url  — Cloud SQL DSN (host+password)
#   gcs_path  — gs://bucket/prefix for logs + dump

set -u
exec > >(tee -a /var/log/migrate.log) 2>&1

md() {
  curl -fsSL -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/$1"
}

SUPA_URL=$(md instance/attributes/supa_url)
CSQL_URL=$(md instance/attributes/csql_url)
GCS_PATH=$(md instance/attributes/gcs_path)
INSTANCE_NAME=$(md instance/name)
INSTANCE_ZONE=$(md instance/zone | awk -F/ '{print $NF}')

echo "==> updating apt + installing postgres16 client"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates gnupg lsb-release
install -d /usr/share/postgresql-common/pgdg
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
apt-get update -y
apt-get install -y postgresql-client-16

echo "==> pg_dump data from Supabase pooler"
mkdir -p /root/dumps
pg_dump "$SUPA_URL" \
  --schema=public --schema=content \
  --data-only \
  --no-owner --no-privileges --no-tablespaces \
  --format=plain \
  --column-inserts \
  --on-conflict-do-nothing \
  --exclude-table=public.content_rag_files \
  --exclude-table=public.blocked_phone_numbers \
  --exclude-table=public.content_knowledge_items \
  --file=/root/dumps/supabase-data.sql 2>&1

if [[ ! -s /root/dumps/supabase-data.sql ]]; then
  echo "!! pg_dump produced empty/missing file"
  gsutil cp /var/log/migrate.log "$GCS_PATH/migrate-FAILED.log"
  shutdown -h +1
  exit 1
fi

echo "==> dump size:"
ls -la /root/dumps/supabase-data.sql
wc -l /root/dumps/supabase-data.sql

echo "==> applying to Cloud SQL (FKs deferred via session_replication_role)"
{
  echo "SET session_replication_role = 'replica';"
  cat /root/dumps/supabase-data.sql
  echo "SET session_replication_role = 'origin';"
} | psql "$CSQL_URL" -v ON_ERROR_STOP=0 2>&1 | tail -200 > /root/restore.log
cat /root/restore.log

echo "==> post-restore row counts:"
psql "$CSQL_URL" -c "SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables WHERE schemaname IN ('public','content') ORDER BY n_live_tup DESC LIMIT 40;" 2>&1 | tee /root/rowcounts.log

echo "==> uploading artifacts to GCS"
gsutil cp /root/dumps/supabase-data.sql "$GCS_PATH/supabase-data.sql" || true
gsutil cp /root/restore.log "$GCS_PATH/restore.log" || true
gsutil cp /root/rowcounts.log "$GCS_PATH/rowcounts.log" || true
gsutil cp /var/log/migrate.log "$GCS_PATH/migrate.log" || true

echo "==> self-destruct in 60s"
( sleep 60 && gcloud compute instances delete "$INSTANCE_NAME" --zone="$INSTANCE_ZONE" --quiet ) &
