jest.mock("@/lib/db/admin-client", () => ({
  dbInsert: jest.fn(),
}));

import { dbInsert } from "@/lib/db/admin-client";
import { POST } from "./route";

const mockedSupabaseInsert = dbInsert as jest.MockedFunction<
  typeof dbInsert
>;

describe("POST /api/internal/persona-signals", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    mockedSupabaseInsert.mockReset();
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it("rejects requests without the internal bearer token", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/internal/persona-signals", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(mockedSupabaseInsert).not.toHaveBeenCalled();
  });

  it("stores persona signal webhook payloads idempotently", async () => {
    mockedSupabaseInsert.mockResolvedValue([
      {
        id: "signal-id",
        user_id: "user-1",
        session_id: "session-1",
        source_message_id: "message-1",
        persona_hint: "practical",
        confidence: "medium",
        evidence: "태동 기준을 구체적으로 질문함",
        weight: 2,
        observed_at: "2026-04-17T11:00:00.000Z",
        created_at: "2026-04-17T11:00:00.000Z",
      },
    ] as never);

    const response = await POST(
      new Request("http://localhost:3000/api/internal/persona-signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-secret",
        },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          sourceMessageId: "message-1",
          personaHint: "practical",
          personaConfidence: "medium",
          personaEvidence: "태동 기준을 구체적으로 질문함",
          idempotencyKey: "workflow-run-1:message-1:practical",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "user_persona_signals",
      expect.objectContaining({
        id: expect.any(String),
        user_id: "user-1",
        session_id: "session-1",
        source_message_id: "message-1",
        persona_hint: "practical",
        confidence: "medium",
        evidence: "태동 기준을 구체적으로 질문함",
        weight: 2,
      }),
      expect.objectContaining({
        onConflict: "id",
        ignoreDuplicates: true,
      }),
    );
    expect(await response.json()).toEqual({
      ok: true,
      signal: expect.objectContaining({
        personaHint: "practical",
        confidence: "medium",
      }),
    });
  });

  it("rejects invalid persona payloads", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/internal/persona-signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-secret",
        },
        body: JSON.stringify({
          userId: "user-1",
          personaHint: "diagnosis",
          personaConfidence: "high",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mockedSupabaseInsert).not.toHaveBeenCalled();
  });
});
