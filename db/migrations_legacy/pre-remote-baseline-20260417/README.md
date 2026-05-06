# Legacy migrations archived from the old remote baseline

These migrations were removed from `db/migrations/` on 2026-04-17
because the remote project history did not contain these versions.

The active migration directory now mirrors the remote history baseline:

- `20251223_create_calendar_logs.sql`
- `20260331172420_move_content_to_public_and_drop_allowlist.sql`
- `20260417120200_add_user_persona_signals.sql`

Why this archive exists:

- The previous local migration directory used date-only versions for many
  files, for example multiple `20260320_*.sql` migrations.
- The old remote migration history was version-based, so those files appeared as
  pending even when the live database already had the corresponding schema.
- Re-running them through the old remote migration path would risk replaying
  old seed, drop, and compatibility migrations against production.

Use these files only as historical reference. New migrations should use a
unique timestamp prefix such as `YYYYMMDDHHMMSS_description.sql`.
