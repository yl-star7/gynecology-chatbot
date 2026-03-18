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
});
