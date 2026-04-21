jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/db/admin-client", () => ({
  dbInsert: jest.fn(),
  dbSelect: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { dbInsert, dbSelect } from "@/lib/db/admin-client";
import { GET, POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedSupabaseSelect = dbSelect as jest.MockedFunction<
  typeof dbSelect
>;
const mockedSupabaseInsert = dbInsert as jest.MockedFunction<
  typeof dbInsert
>;

describe("/api/admin/users/persona", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseInsert.mockReset();
  });

  it("rejects unauthenticated reads", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost:3000/api/admin/users/persona?userId=user-1"),
    );

    expect(response.status).toBe(401);
    expect(mockedSupabaseSelect).not.toHaveBeenCalled();
  });

  it("loads a user's current persona profile and recent signals", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    mockedSupabaseSelect.mockImplementation((path: string) => {
      if (path.startsWith("v_user_persona_profiles?")) {
        return Promise.resolve([
          {
            user_id: "user-1",
            persona_hint: "practical",
            confidence: "medium",
            evidence_summary: "태동 기준을 구체적으로 질문함",
            weighted_score: 2.5,
            last_observed_at: "2026-04-17T10:00:00.000Z",
          },
        ]);
      }

      if (path.startsWith("user_persona_signals?")) {
        return Promise.resolve([
          {
            id: "signal-1",
            user_id: "user-1",
            session_id: "session-1",
            source_message_id: "message-1",
            persona_hint: "practical",
            confidence: "medium",
            evidence: "태동 기준을 구체적으로 질문함",
            weight: 2,
            observed_at: "2026-04-17T10:00:00.000Z",
            created_at: "2026-04-17T10:00:00.000Z",
          },
        ]);
      }

      return Promise.resolve([]);
    });

    const response = await GET(
      new Request("http://localhost:3000/api/admin/users/persona?userId=user-1"),
    );

    expect(response.status).toBe(200);
    expect(mockedSupabaseSelect).toHaveBeenCalledWith(
      "v_user_persona_profiles?select=user_id,persona_hint,confidence,evidence_summary,weighted_score,last_observed_at&user_id=eq.user-1&limit=1",
    );
    expect(mockedSupabaseSelect).toHaveBeenCalledWith(
      "user_persona_signals?select=id,user_id,session_id,source_message_id,persona_hint,confidence,evidence,weight,observed_at,created_at&user_id=eq.user-1&order=observed_at.desc&limit=20",
    );

    const payload = await response.json();
    expect(payload).toEqual({
      profile: expect.objectContaining({
        personaHint: "practical",
        confidence: "medium",
        weightedScore: 2.5,
      }),
      signals: [
        expect.objectContaining({
          id: "signal-1",
          personaHint: "practical",
          confidence: "medium",
        }),
      ],
    });
  });

  it("stores a manual persona signal for authenticated admins", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    mockedSupabaseInsert.mockResolvedValue([
      {
        id: "signal-2",
        user_id: "user-1",
        persona_hint: "anxious",
        confidence: "high",
        evidence: "반복적으로 아기 성장 걱정을 표현함",
        weight: 3,
        observed_at: "2026-04-17T11:00:00.000Z",
        created_at: "2026-04-17T11:00:00.000Z",
      },
    ] as never);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          personaHint: "anxious",
          confidence: "high",
          evidence: "반복적으로 아기 성장 걱정을 표현함",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedSupabaseInsert).toHaveBeenCalledWith(
      "user_persona_signals",
      expect.objectContaining({
        user_id: "user-1",
        persona_hint: "anxious",
        confidence: "high",
        evidence: "반복적으로 아기 성장 걱정을 표현함",
        weight: 3,
      }),
    );

    const payload = await response.json();
    expect(payload.signal).toMatchObject({
      id: "signal-2",
      personaHint: "anxious",
      confidence: "high",
    });
  });

  it("rejects invalid manual persona signals", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          personaHint: "diagnosis",
          confidence: "high",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mockedSupabaseInsert).not.toHaveBeenCalled();
  });
});
