jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/db/admin-client", () => ({
  dbSelect: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { dbSelect } from "@/lib/db/admin-client";

import { GET } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedSupabaseSelect = dbSelect as jest.MockedFunction<
  typeof dbSelect
>;

describe("GET /api/admin/analytics", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedSupabaseSelect.mockReset();
  });

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  test("returns login counts alongside the existing analytics totals", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedSupabaseSelect.mockImplementation(async (path: string) => {
      if (
        path.startsWith(
          "pregnancy_profiles?select=user_id&push_token=not.is.null",
        )
      ) {
        return [{ user_id: "user-1" }, { user_id: "user-2" }];
      }
      if (path.startsWith("users?")) {
        return [{ id: "user-1" }, { id: "user-2" }];
      }
      if (path.startsWith("pregnancy_profiles?select=user_id&")) {
        return [{ user_id: "user-1" }];
      }
      if (path.startsWith("chat_sessions?")) {
        return [{ id: "session-1" }, { id: "session-2" }, { id: "session-3" }];
      }
      if (path.startsWith("chat_messages?")) {
        return [{ id: "message-1" }, { id: "message-2" }];
      }
      if (
        path.startsWith(
          "user_action_logs?select=id&action_type=eq.login_succeeded&occurred_at=",
        )
      ) {
        if (path.includes("gte.")) {
          return path.includes("limit=10000")
            ? [{ id: "login-1" }, { id: "login-2" }, { id: "login-3" }]
            : [];
        }
      }
      if (path.startsWith("calendar_logs?")) {
        return [{ id: "emotion-1" }];
      }

      return [];
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      totalUsers: 2,
      onboardedUsers: 1,
      todaySessions: 3,
      weekMessages: 2,
      todayLogins: 3,
      weekLogins: 3,
      todayEmotions: 1,
      pushEnabled: 2,
    });
    expect(body.dailyTrend).toHaveLength(7);
    for (const day of body.dailyTrend) {
      expect(day).toEqual(
        expect.objectContaining({
          date: expect.any(String),
          sessions: expect.any(Number),
          logins: expect.any(Number),
          messages: expect.any(Number),
        }),
      );
    }
  });
});
