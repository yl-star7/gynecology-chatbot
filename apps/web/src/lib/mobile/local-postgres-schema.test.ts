import { buildLocalPostgresBootstrapSql } from "./local-postgres-schema";

describe("buildLocalPostgresBootstrapSql", () => {
  test("creates chat sessions before tables that reference them", () => {
    const sql = buildLocalPostgresBootstrapSql("gynecology_local");

    const chatSessionsIndex = sql.indexOf(
      'CREATE TABLE IF NOT EXISTS "gynecology_local"."chat_sessions"',
    );
    const calendarLogsIndex = sql.indexOf(
      'CREATE TABLE IF NOT EXISTS "gynecology_local"."calendar_logs"',
    );
    const chatMessagesIndex = sql.indexOf(
      'CREATE TABLE IF NOT EXISTS "gynecology_local"."chat_messages"',
    );

    expect(chatSessionsIndex).toBeGreaterThanOrEqual(0);
    expect(calendarLogsIndex).toBeGreaterThanOrEqual(0);
    expect(chatMessagesIndex).toBeGreaterThanOrEqual(0);
    expect(chatSessionsIndex).toBeLessThan(calendarLogsIndex);
    expect(chatSessionsIndex).toBeLessThan(chatMessagesIndex);
  });

  test("includes memory_payload column on chat_sessions", () => {
    const sql = buildLocalPostgresBootstrapSql("gynecology_local");

    expect(sql).toContain('memory_payload jsonb NOT NULL DEFAULT \'{}\'::jsonb');
  });

  test("includes paraphrase tables and active encyclopedia view", () => {
    const sql = buildLocalPostgresBootstrapSql("gynecology_local");

    expect(sql).toContain(
      'CREATE TABLE IF NOT EXISTS "gynecology_local"."content_paraphrase_runs"',
    );
    expect(sql).toContain(
      'CREATE TABLE IF NOT EXISTS "gynecology_local"."content_paraphrased_items"',
    );
    expect(sql).toContain(
      'CREATE OR REPLACE VIEW "gynecology_local"."v_weekly_encyclopedia"',
    );
  });
});
