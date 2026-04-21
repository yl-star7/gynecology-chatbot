jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  mobileNoStoreJson: jest.fn((payload: unknown, init?: ResponseInit) =>
    Response.json(payload, {
      ...init,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        ...(init?.headers as Record<string, string> | undefined),
      },
    }),
  ),
  isMobileSessionError: jest.fn((error: unknown) => {
    return (
      error instanceof Error &&
      error.message === "mobile session token is required"
    );
  }),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      {
        status:
          error instanceof Error &&
          error.message === "mobile session token is required"
            ? 401
            : 500,
      },
    ),
  ),
}));

jest.mock("@/lib/mobile/serializers", () => ({
  toHomeViewData: jest.fn(),
}));

var mockedPrisma: any;
jest.mock("@gynecology-chatbot/db/prisma", () => {
  mockedPrisma = {
    pregnancy_profiles: {
      findUnique: jest.fn(),
    },
    v_user_calendar_activity: {
      findMany: jest.fn(),
    },
    system_config: {
      findUnique: jest.fn(),
    },
  };

  return { prisma: mockedPrisma };
});

import { createKoreanDateKey } from "@gynecology-chatbot/app-core/time";
import { requireMobileSession } from "@/lib/mobile/session-auth";
import { GET } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;

describe("GET /api/mobile/home", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedPrisma.pregnancy_profiles.findUnique.mockReset();
    mockedPrisma.v_user_calendar_activity.findMany.mockReset();
    mockedPrisma.system_config.findUnique.mockReset();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns 401 when the mobile session is missing", async () => {
    mockedRequireMobileSession.mockRejectedValue(
      new Error("mobile session token is required"),
    );

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/home?userId=user-1"),
    } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "mobile session token is required",
    });
  });

  it("uses the actual last day of the requested month for calendar range queries", async () => {
    const { toHomeViewData } = jest.requireMock("@/lib/mobile/serializers") as {
      toHomeViewData: jest.Mock;
    };
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedPrisma.pregnancy_profiles.findUnique.mockResolvedValue({
      display_name: "사용자",
      pregnancy_day_count: 192,
      pregnancy_week: 27,
      pregnancy_day_in_week: 3,
      due_date: new Date("2026-07-01T00:00:00.000Z"),
    });
    mockedPrisma.v_user_calendar_activity.findMany.mockResolvedValue([]);
    mockedPrisma.system_config.findUnique.mockResolvedValue(null);
    toHomeViewData.mockReturnValue({ ok: true });

    const response = await GET({
      nextUrl: new URL(
        "http://localhost:3000/api/mobile/home?userId=user-1&month=2026-04",
      ),
    } as never);

    expect(response.status).toBe(200);
    expect(mockedPrisma.v_user_calendar_activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user_id: "user-1",
          date: {
            gte: new Date("2026-04-01T00:00:00.000Z"),
            lte: new Date("2026-04-30T00:00:00.000Z"),
          },
        }),
      }),
    );
  });

  it("keeps today's chat activity but defers the calendar summary copy", async () => {
    const { toHomeViewData } = jest.requireMock("@/lib/mobile/serializers") as {
      toHomeViewData: jest.Mock;
    };
    const today = createKoreanDateKey();

    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedPrisma.pregnancy_profiles.findUnique.mockResolvedValue({
      display_name: "사용자",
      pregnancy_day_count: 192,
      pregnancy_week: 27,
      pregnancy_day_in_week: 3,
      due_date: null,
    });
    mockedPrisma.v_user_calendar_activity.findMany.mockResolvedValue([
      {
        date: new Date(`${today}T00:00:00.000Z`),
        summary: "오늘 상담 요약",
        entry_type: "chat_saved",
      },
    ]);
    mockedPrisma.system_config.findUnique.mockResolvedValue(null);
    toHomeViewData.mockReturnValue({ ok: true });

    const response = await GET({
      nextUrl: new URL(
        `http://localhost:3000/api/mobile/home?userId=user-1&month=${today.slice(
          0,
          7,
        )}`,
      ),
    } as never);

    expect(response.status).toBe(200);
    expect(toHomeViewData).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarRows: [
          {
            date: today,
            summary: null,
            entry_type: "chat_saved",
          },
        ],
      }),
    );
  });
});
