jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      { status: 500 },
    ),
  ),
}));

var adminSupabaseInsertMock: jest.Mock;
var adminSupabaseSelectMock: jest.Mock;
var adminSupabaseUpdateMock: jest.Mock;

jest.mock("@/lib/supabase/admin-client", () => {
  adminSupabaseInsertMock = jest.fn();
  adminSupabaseSelectMock = jest.fn();
  adminSupabaseUpdateMock = jest.fn();

  return {
    supabaseInsert: adminSupabaseInsertMock,
    supabaseSelect: adminSupabaseSelectMock,
    supabaseUpdate: adminSupabaseUpdateMock,
  };
});

import { requireMobileSession } from "@/lib/mobile/session-auth";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";
import { GET, POST } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSupabaseInsert = supabaseInsert as jest.MockedFunction<
  typeof supabaseInsert
>;
const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedSupabaseUpdate = supabaseUpdate as jest.MockedFunction<
  typeof supabaseUpdate
>;

describe("GET /api/mobile/records", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseUpdate.mockReset();
  });

  it("체크리스트 라벨에서 괄호 참고표기를 제거한다", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-24" }] as never)
      .mockResolvedValueOnce([
        {
          id: "check-1",
          title: "가렵지 않게 자주 발라 주세요 (1)(3)(5)(8)",
          description: null,
          display_order: 1,
        },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-24" }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/records?userId=user-1&date=2026-04-13",
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await GET(request as never);

    await expect(response.json()).resolves.toEqual({
      recordDay: expect.objectContaining({
        checklistItems: [
          {
            id: "check-1",
            label: "가렵지 않게 자주 발라 주세요",
            completed: false,
          },
        ],
      }),
    });
  });
});

describe("POST /api/mobile/records", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseUpdate.mockReset();
  });

  it("updates profileMemory.lastEmotionTone when emotion check-in is saved", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedSupabaseInsert.mockResolvedValue([] as never);
    mockedSupabaseSelect.mockResolvedValue([] as never);
    mockedSupabaseUpdate.mockResolvedValue([] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/records?userId=user-1",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          emotionTone: "anxious",
        }),
      },
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "pregnancy_profiles?user_id=eq.user-1",
      expect.objectContaining({
        onboarding_payload: expect.objectContaining({
          profileMemory: expect.objectContaining({
            lastEmotionTone: "anxious",
          }),
        }),
      }),
    );
  });

  it("preserves existing onboarding payload fields when profileMemory is updated", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedSupabaseInsert.mockResolvedValue([] as never);
    mockedSupabaseSelect.mockResolvedValueOnce([
      {
        onboarding_payload: {
          tonePreference: "차분하게",
          babyName: "콩이",
          profileMemory: {
            lastEmotionTone: "calm",
          },
        },
      },
    ] as never);
    mockedSupabaseUpdate.mockResolvedValue([] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/records?userId=user-1",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          emotionTone: "sad",
        }),
      },
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "pregnancy_profiles?user_id=eq.user-1",
      expect.objectContaining({
        onboarding_payload: expect.objectContaining({
          tonePreference: "차분하게",
          babyName: "콩이",
          profileMemory: expect.objectContaining({
            lastEmotionTone: "sad",
          }),
        }),
      }),
    );
  });
});
