#!/usr/bin/env bash
# One-shot migration from Supabase Postgres → Cloud SQL (agaya-db).
# Run this AFTER Supabase origin is back up.
#
# Required env:
#   SUPA_URL      Supabase Session Pooler URL (postgres.<ref>:...@aws-X-<region>.pooler.supabase.com:5432/postgres)
#   CSQL_URL      Cloud SQL URL (postgres://postgres:<pw>@34.64.81.95:5432/agaya)
#
# Dumps ONLY public + content schemas (skips auth/storage/pg_* extensions).

set -euo pipefail

: "${SUPA_URL:?set SUPA_URL}"
: "${CSQL_URL:?set CSQL_URL}"

DUMP_DIR="/Users/jskang/Projects/si/.gcp/dumps"
mkdir -p "$DUMP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
DUMP_FILE="$DUMP_DIR/supabase-$STAMP.sql"

echo "==> dumping public + content schemas to $DUMP_FILE"
pg_dump "$SUPA_URL" \
  --schema=public --schema=content \
  --no-owner --no-privileges --no-tablespaces \
  --exclude-table-data='auth.*' \
  --format=plain \
  --file="$DUMP_FILE"

echo "==> dump size: $(du -h "$DUMP_FILE" | cut -f1)"
echo "==> stripping Supabase-specific references..."
# Remove auth.uid() RLS policies, pg_graphql/pgsodium references that Cloud SQL can't install.
sed -i '' \
  -e 's/auth\.uid()/NULL/g' \
  -e '/CREATE EXTENSION.*pg_graphql/d' \
  -e '/CREATE EXTENSION.*pgsodium/d' \
  -e '/CREATE EXTENSION.*pg_stat_monitor/d' \
  -e '/CREATE EXTENSION.*supabase_vault/d' \
  "$DUMP_FILE"

echo "==> restoring into Cloud SQL..."
psql "$CSQL_URL" -v ON_ERROR_STOP=0 -f "$DUMP_FILE" 2>&1 | tail -30
echo ""
echo "==> verification:"
psql "$CSQL_URL" -c "SELECT schemaname, count(*) FROM pg_tables WHERE schemaname IN ('public','content') GROUP BY schemaname;" 2>&1
