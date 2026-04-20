#!/usr/bin/env python3
"""Generate Cloud SQL Postgres schema DDL from Supabase metadata JSON files.

Inputs (under /tmp):
  - si-columns.json       : column metadata
  - si-constraints.json   : PK/FK/UNIQUE/CHECK
  - si-indexes.json       : indexes
  - si-views.json         : views

Output:
  - /Users/jskang/Projects/si/.gcp/cloudsql-schema.sql
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

COLUMNS_PATH = Path("/tmp/si-columns.json")
CONSTRAINTS_PATH = Path("/tmp/si-constraints.json")
INDEXES_PATH = Path("/tmp/si-indexes.json")
VIEWS_PATH = Path("/tmp/si-views.json")

OUT_PATH = Path("/Users/jskang/Projects/si/.gcp/cloudsql-schema.sql")


def qident(name: str) -> str:
    """Quote a SQL identifier safely."""
    return '"' + name.replace('"', '""') + '"'


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    columns = load_json(COLUMNS_PATH)
    constraints = load_json(CONSTRAINTS_PATH)
    indexes = load_json(INDEXES_PATH)
    views = load_json(VIEWS_PATH)

    # Group columns by (schema, table), preserve ord order
    cols_by_table: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in columns:
        cols_by_table[(row["schema"], row["table"])].append(row)
    for k in cols_by_table:
        cols_by_table[k].sort(key=lambda r: r["ord"])

    # Group constraints by (schema, table) and by kind
    pk_uc_by_table: dict[tuple[str, str], list[dict]] = defaultdict(list)
    fk_list: list[dict] = []
    # names of constraints that implicitly create an index (pk, unique)
    implicit_index_names: set[str] = set()

    for c in constraints:
        key = (c["schema"], c["tbl"])
        t = c["t"]
        if t == "f":
            fk_list.append(c)
        elif t in ("p", "u", "c"):
            pk_uc_by_table[key].append(c)
            if t in ("p", "u"):
                implicit_index_names.add(c["name"])

    out: list[str] = []
    out.append("-- ============================================================")
    out.append("-- Cloud SQL Postgres schema generated from Supabase metadata")
    out.append("-- Generator: scripts/gen-schema-ddl.py")
    out.append("-- ============================================================")
    out.append("")

    # (a) Extensions
    out.append("-- Extensions")
    out.append('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    out.append("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    out.append("CREATE EXTENSION IF NOT EXISTS vector;")
    out.append("-- pg_stat_statements is optional; ignore failure")
    out.append("DO $$ BEGIN")
    out.append("  BEGIN")
    out.append("    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;")
    out.append("  EXCEPTION WHEN OTHERS THEN")
    out.append("    RAISE NOTICE 'pg_stat_statements unavailable: %', SQLERRM;")
    out.append("  END;")
    out.append("END $$;")
    out.append("")

    # (b) schema
    out.append("-- Schemas")
    out.append("CREATE SCHEMA IF NOT EXISTS content;")
    out.append("")

    # (c, d) CREATE TABLE with inline PK/UNIQUE/CHECK
    # Keep deterministic ordering: schema then table
    table_keys = sorted(cols_by_table.keys())
    out.append("-- Tables")
    for schema, table in table_keys:
        cols = cols_by_table[(schema, table)]
        lines: list[str] = []
        for c in cols:
            parts = [f"  {qident(c['col'])} {c['type_def']}"]
            if c.get("default_expr"):
                parts.append(f"DEFAULT {c['default_expr']}")
            if not c["nullable"]:
                parts.append("NOT NULL")
            lines.append(" ".join(parts))

        # inline PK / UNIQUE / CHECK constraints
        table_constraints = pk_uc_by_table.get((schema, table), [])
        # Order: PK first, UNIQUE next, CHECK last (stable within each by name)
        order = {"p": 0, "u": 1, "c": 2}
        table_constraints = sorted(table_constraints, key=lambda x: (order[x["t"]], x["name"]))
        for cons in table_constraints:
            lines.append(f"  CONSTRAINT {qident(cons['name'])} {cons['def']}")

        body = ",\n".join(lines)
        out.append(f"CREATE TABLE {qident(schema)}.{qident(table)} (")
        out.append(body)
        out.append(");")
        out.append("")

    # (e) FKs
    out.append("-- Foreign keys")
    for fk in sorted(fk_list, key=lambda x: (x["schema"], x["tbl"], x["name"])):
        out.append(
            f"ALTER TABLE {qident(fk['schema'])}.{qident(fk['tbl'])} "
            f"ADD CONSTRAINT {qident(fk['name'])} {fk['def']};"
        )
    out.append("")

    # (f) Indexes - skip those whose name matches a pk/unique constraint
    out.append("-- Indexes")
    for idx in indexes:
        name = idx["indexname"]
        if name in implicit_index_names:
            continue
        out.append(f"{idx['indexdef']};")
    out.append("")

    # (g) Views
    out.append("-- Views")
    for v in views:
        schema = v["schema"]
        name = v["name"]
        defn = v["def"].strip()
        # rstrip trailing semicolon to avoid double-semicolons
        defn_stripped = defn.rstrip().rstrip(";").rstrip()
        out.append(
            f"CREATE OR REPLACE VIEW {qident(schema)}.{qident(name)} AS {defn_stripped};"
        )
        out.append("")

    OUT_PATH.write_text("\n".join(out), encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({OUT_PATH.stat().st_size} bytes)")

    # Summary
    pub_tables = sum(1 for s, _ in table_keys if s == "public")
    content_tables = sum(1 for s, _ in table_keys if s == "content")
    print(f"Tables: public={pub_tables}, content={content_tables}, total={len(table_keys)}")
    print(f"FKs: {len(fk_list)}")
    skipped_idx = sum(1 for i in indexes if i["indexname"] in implicit_index_names)
    print(f"Indexes emitted: {len(indexes) - skipped_idx}, skipped (pk/unique duplicates): {skipped_idx}")
    print(f"Views: {len(views)}")


if __name__ == "__main__":
    main()
