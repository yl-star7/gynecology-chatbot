jest.mock("@/lib/admin/auth", () => ({
  authenticateAdmin: jest.fn(),
  writeAdminSession: jest.fn(),
}));

const mockCheckRateLimit = jest.fn();

jest.mock("@/lib/mobile/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

import { authenticateAdmin, writeAdminSession } from "@/lib/admin/auth";
import { POST } from "./route";

const mockedAuthenticateAdmin = jest.mocked(authenticateAdmin);
const mockedWriteAdminSession = jest.mocked(writeAdminSession);

describe("POST /api/admin/auth/login", () => {
  beforeEach(() => {
    mockedAuthenticateAdmin.mockReset();
    mockedWriteAdminSession.mockReset();
    mockCheckRateLimit.mockReset();
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetAt: Date.now() + 60_000,
    });
  });

  test("rate limits repeated admin login attempts", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "1.2.3.4",
        },
        body: JSON.stringify({
          phoneNumber: "01011112222",
          password: "bad-pass",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);

    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 15_000,
    });

    const limited = await POST(
      new Request("http://localhost:3000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "1.2.3.4",
        },
        body: JSON.stringify({
          phoneNumber: "01011112222",
          password: "bad-pass",
        }),
      }) as never,
    );

    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
    expect(mockedWriteAdminSession).not.toHaveBeenCalled();
  });
});
