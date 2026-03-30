jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  isMobileSessionError: jest.fn((error: unknown) => {
    return (
      error instanceof Error &&
      error.message === "mobile session token is required"
    );
  }),
  mobileRouteErrorResponse: jest.fn(
    (error: unknown, fallbackMessage: string, status?: number) =>
      Response.json(
        { error: error instanceof Error ? error.message : fallbackMessage },
        {
          status:
            error instanceof Error &&
            error.message === "mobile session token is required"
              ? 401
              : (status ?? 500),
        },
      ),
  ),
}));

jest.mock("@/lib/mobile/auth", () => ({
  completeUserOnboarding: jest.fn(),
}));

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { completeUserOnboarding } from "@/lib/mobile/auth";
import { POST } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedCompleteUserOnboarding =
  completeUserOnboarding as jest.MockedFunction<typeof completeUserOnboarding>;

describe("POST /api/mobile/onboarding", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedCompleteUserOnboarding.mockReset();
  });

  it("pregnancyWeekOrDueDate가 0이면 400 반환", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/mobile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          pregnancyWeekOrDueDate: "0",
          tonePreference: "calm",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBeTruthy();
  });

  it("pregnancyWeekOrDueDate가 43이면 400 반환", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/mobile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          pregnancyWeekOrDueDate: "43",
          tonePreference: "calm",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBeTruthy();
  });

  it("유효하지 않은 날짜 문자열이면 400 반환", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/mobile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          pregnancyWeekOrDueDate: "not-a-date",
          tonePreference: "calm",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBeTruthy();
  });

  it("날짜 뒤에 다른 문구가 붙으면 400 반환", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/mobile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          pregnancyWeekOrDueDate: "2026-08-15 / 태명: 콩이",
          tonePreference: "calm",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "올바른 날짜 형식이 아니에요.",
    });
  });

  it("정상 주차(20주)이면 onboarding 완료 후 200 반환", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedCompleteUserOnboarding.mockResolvedValue({
      id: "user-1",
      displayName: "김수연",
      phoneNumber: "01012345678",
      hasCompletedOnboarding: true,
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          pregnancyWeekOrDueDate: "20",
          tonePreference: "calm",
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.user).toBeDefined();
  });

  it("정상 날짜(유효한 due date)이면 onboarding 완료 후 200 반환", async () => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedCompleteUserOnboarding.mockResolvedValue({
      id: "user-1",
      displayName: "김수연",
      phoneNumber: "01012345678",
      hasCompletedOnboarding: true,
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/mobile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          pregnancyWeekOrDueDate: "2026-08-15",
          tonePreference: "calm",
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.user).toBeDefined();
  });
});
