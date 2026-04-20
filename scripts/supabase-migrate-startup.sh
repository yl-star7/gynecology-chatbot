#!/usr/bin/env bash
# VM startup: pg_dump Supabase -> Cloud SQL Auth Proxy (socket) -> psql restore -> GCS log -> self-destruct.
#
# Metadata keys used:
#   supa_url        Supabase pooler DSN (IPv4 session pooler)
#   csql_password   Cloud SQL postgres password
#   csql_instance   Cloud SQL connection name (project:region:instance)
#   gcs_path        gs://bucket/prefix for logs + dump

set -u
exec > >(tee -a /var/log/migrate.log) 2>&1

md() {
  curl -fsSL -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/$1"
}

SUPA_URL=$(md instance/attributes/supa_url)
CSQL_PW=$(md instance/attributes/csql_password)
CSQL_INSTANCE=$(md instance/attributes/csql_instance)
GCS_PATH=$(md instance/attributes/gcs_path)
INSTANCE_NAME=$(md instance/name)
INSTANCE_ZONE=$(md instance/zone | awk -F/ '{print $NF}')

echo "==> installing postgres16 client + cloud-sql-proxy"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates gnupg lsb-release
install -d /usr/share/postgresql-common/pgdg
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
apt-get update -y
apt-get install -y postgresql-client-16

curl -fsSL -o /usr/local/bin/cloud-sql-proxy \
  https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.15.0/cloud-sql-proxy.linux.amd64
chmod +x /usr/local/bin/cloud-sql-proxy

echo "==> starting cloud-sql-proxy (unix socket)"
mkdir -p /tmp/cloudsql
nohup /usr/local/bin/cloud-sql-proxy \
  --unix-socket /tmp/cloudsql \
  "$CSQL_INSTANCE" \
  >/var/log/cloud-sql-proxy.log 2>&1 &
PROXY_PID=$!
sleep 8
SOCKET_DIR="/tmp/cloudsql/${CSQL_INSTANCE}"
for i in 1 2 3 4 5 6 7 8 9 10; do
  if [[ -S "${SOCKET_DIR}/.s.PGSQL.5432" ]]; then
    echo "   proxy socket ready"
    break
  fi
  echo "   waiting for proxy socket... ($i)"
  sleep 3
done

echo "==> verifying Cloud SQL connection"
PGPASSWORD="$CSQL_PW" psql "host=${SOCKET_DIR} user=postgres dbname=agaya" -c "SELECT version();" || {
  echo "!! cannot connect to Cloud SQL"
  gsutil cp /var/log/migrate.log "$GCS_PATH/migrate-FAILED.log" || true
  gsutil cp /var/log/cloud-sql-proxy.log "$GCS_PATH/proxy-FAILED.log" || true
  exit 1
}

echo "==> pg_dump from Supabase pooler"
mkdir -p /root/dumps
for attempt in 1 2 3; do
  if pg_dump "$SUPA_URL" \
       --schema=public --schema=content \
       --data-only \
       --no-owner --no-privileges --no-tablespaces \
       --format=plain \
       --column-inserts \
       --on-conflict-do-nothing \
       --exclude-table=public.content_rag_files \
       --exclude-table=public.blocked_phone_numbers \
       --exclude-table=public.content_knowledge_items \
       --file=/root/dumps/supabase-data.sql 2>&1; then
    echo "   pg_dump attempt $attempt succeeded"
    break
  fi
  echo "   pg_dump attempt $attempt failed, retrying in 15s..."
  sleep 15
done

if [[ ! -s /root/dumps/supabase-data.sql ]]; then
  echo "!! pg_dump produced empty/missing file after retries"
  gsutil cp /var/log/migrate.log "$GCS_PATH/migrate-FAILED.log" || true
  exit 1
fi

ls -la /root/dumps/supabase-data.sql
wc -l /root/dumps/supabase-data.sql

echo "==> applying to Cloud SQL (FKs deferred via session_replication_role)"
{
  echo "SET session_replication_role = 'replica';"
  cat /root/dumps/supabase-data.sql
  echo "SET session_replication_role = 'origin';"
} | PGPASSWORD="$CSQL_PW" psql "host=${SOCKET_DIR} user=postgres dbname=agaya" \
    -v ON_ERROR_STOP=0 > /root/restore.log 2>&1
tail -200 /root/restore.log

echo "==> post-restore row counts"
PGPASSWORD="$CSQL_PW" psql "host=${SOCKET_DIR} user=postgres dbname=agaya" \
  -c "SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables WHERE schemaname IN ('public','content') ORDER BY n_live_tup DESC LIMIT 40;" \
  2>&1 | tee /root/rowcounts.log

echo "==> uploading artifacts to GCS"
gsutil cp /root/dumps/supabase-data.sql "$GCS_PATH/supabase-data.sql" || true
gsutil cp /root/restore.log "$GCS_PATH/restore.log" || true
gsutil cp /root/rowcounts.log "$GCS_PATH/rowcounts.log" || true
gsutil cp /var/log/migrate.log "$GCS_PATH/migrate.log" || true
gsutil cp /var/log/cloud-sql-proxy.log "$GCS_PATH/cloud-sql-proxy.log" || true

echo "==> self-destruct in 60s"
( sleep 60 && gcloud compute instances delete "$INSTANCE_NAME" --zone="$INSTANCE_ZONE" --quiet ) &
