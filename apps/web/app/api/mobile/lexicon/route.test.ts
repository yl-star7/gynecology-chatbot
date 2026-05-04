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
  isMobileSessionError: jest.fn(
    (error: unknown) =>
      error instanceof Error &&
      error.message === "mobile session token is required",
  ),
}));

var mockedPrisma: any;
jest.mock("@gynecology-chatbot/db/prisma", () => {
  mockedPrisma = {
    content_pregnancy_week_data: {
      findMany: jest.fn(),
    },
    content_pregnancy_day_contents: {
      findMany: jest.fn(),
    },
    content_week_checklists: {
      findMany: jest.fn(),
    },
    content_week_questions: {
      findMany: jest.fn(),
    },
  };
  return { prisma: mockedPrisma };
});

import type { NextRequest } from "next/server";
import { requireMobileSession } from "@/lib/mobile/session-auth";
import { GET } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;

function buildRequest(url: string, init?: { authorization?: string }) {
  const headers = new Headers();
  if (init?.authorization) headers.set("Authorization", init.authorization);
  return new Request(url, { method: "GET", headers }) as unknown as NextRequest;
}

const SAMPLE_WEEKS = [
  {
    id: "week-row-12",
    week_number: 12,
    title: "12주차",
    baby_summary: "아기의 기본 구조가 더 또렷해져요.",
    mother_summary: "입덧이 조금씩 줄 수 있어요.",
    warning_signs: "심한 복통이나 출혈이 있으면 확인이 필요해요.",
    recommended_actions: "정기 검진 일정을 챙겨요.",
  },
  {
    id: "week-row-20",
    week_number: 20,
    title: "20주차",
    baby_summary: "아기가 더 활발히 움직여요.",
    mother_summary: "태동을 느끼는 날이 늘 수 있어요.",
    warning_signs: null,
    recommended_actions: "태동 느낌을 편하게 기록해요.",
  },
];

const SAMPLE_DAYS = [
  {
    id: "day-row-12-1",
    week_data_id: "week-row-12",
    day_number: 1,
    title: "몸의 변화 살피기",
    baby_message: "오늘도 천천히 자라고 있어요.",
    baby_development_payload: { items: ["손가락 움직임이 더 섬세해져요."] },
    mother_changes_payload: { items: ["피로감이 줄어들 수 있어요."] },
  },
  {
    id: "day-row-20-3",
    week_data_id: "week-row-20",
    day_number: 3,
    title: "태동 기록",
    baby_message: "작은 움직임으로 인사할 수 있어요.",
    baby_development_payload: { items: ["움직임이 더 또렷해져요."] },
    mother_changes_payload: { items: ["배가 당기는 느낌이 있을 수 있어요."] },
  },
];

beforeEach(() => {
  mockedRequireMobileSession.mockReset();
  mockedPrisma.content_pregnancy_week_data.findMany.mockReset();
  mockedPrisma.content_pregnancy_day_contents.findMany.mockReset();
  mockedPrisma.content_week_checklists.findMany.mockReset();
  mockedPrisma.content_week_questions.findMany.mockReset();

  mockedPrisma.content_pregnancy_week_data.findMany.mockResolvedValue(
    SAMPLE_WEEKS,
  );
  mockedPrisma.content_pregnancy_day_contents.findMany.mockResolvedValue(
    SAMPLE_DAYS,
  );
  mockedPrisma.content_week_checklists.findMany.mockResolvedValue([
    {
      week_data_id: "week-row-20",
      day_number: 3,
      title: "태동 느낌 기록하기",
      description: "편안한 시간에 짧게 적어봐요.",
    },
  ]);
  mockedPrisma.content_week_questions.findMany.mockResolvedValue([
    {
      week_data_id: "week-row-20",
      day_number: 3,
      question_text: "오늘 가장 편안했던 순간은 언제였나요?",
    },
  ]);
  mockedRequireMobileSession.mockResolvedValue({
    userId: "user-1",
    sessionId: "session-1",
  } as never);
});

describe("GET /api/mobile/lexicon", () => {
  test("auth failure returns 401", async () => {
    mockedRequireMobileSession.mockRejectedValueOnce(
      new Error("mobile session token is required"),
    );

    const response = await GET(
      buildRequest("http://localhost/api/mobile/lexicon"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "mobile session token is required",
    });
  });

  test("returns generated week overview and day documents", async () => {
    const response = await GET(
      buildRequest("http://localhost/api/mobile/lexicon", {
        authorization: "Bearer t",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Server-Timing")).toContain("total;dur=");
    const payload = (await response.json()) as {
      items: Array<{
        id: string;
        week: number | null;
        day: number | null;
        surface: string | null;
      }>;
    };

    expect(payload.items).toEqual([
      expect.objectContaining({
        id: "week-12-overview",
        week: 12,
        day: null,
        surface: "week_overview",
      }),
      expect.objectContaining({
        id: "week-12-day-1",
        week: 12,
        day: 1,
        surface: "week_day",
      }),
      expect.objectContaining({
        id: "week-20-overview",
        week: 20,
        day: null,
        surface: "week_overview",
      }),
      expect.objectContaining({
        id: "week-20-day-3",
        week: 20,
        day: 3,
        surface: "week_day",
      }),
    ]);
  });

  test("filters by week query param", async () => {
    mockedPrisma.content_pregnancy_week_data.findMany.mockResolvedValue([
      SAMPLE_WEEKS[0],
    ]);
    mockedPrisma.content_pregnancy_day_contents.findMany.mockResolvedValue([
      SAMPLE_DAYS[0],
    ]);

    const response = await GET(
      buildRequest("http://localhost/api/mobile/lexicon?week=12", {
        authorization: "Bearer t",
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      items: Array<{ id: string; week: number | null }>;
    };

    expect(payload.items.map((item) => item.id)).toEqual([
      "week-12-overview",
      "week-12-day-1",
    ]);
    expect(payload.items.every((item) => item.week === 12)).toBe(true);
    expect(
      mockedPrisma.content_pregnancy_week_data.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "published", week_number: 12 },
      }),
    );
    expect(
      mockedPrisma.content_pregnancy_day_contents.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { week_data_id: { in: ["week-row-12"] } },
      }),
    );
  });

  test("filters by surface query param", async () => {
    const response = await GET(
      buildRequest("http://localhost/api/mobile/lexicon?surface=week_day", {
        authorization: "Bearer t",
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      items: Array<{ id: string; surface: string | null }>;
    };

    expect(payload.items.map((item) => item.id)).toEqual([
      "week-12-day-1",
      "week-20-day-3",
    ]);
    expect(payload.items.every((item) => item.surface === "week_day")).toBe(
      true,
    );
  });

  test("filters by q substring on title or snippet", async () => {
    const response = await GET(
      buildRequest("http://localhost/api/mobile/lexicon?q=태동", {
        authorization: "Bearer t",
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      items: Array<{ id: string }>;
    };

    expect(payload.items.map((item) => item.id)).toEqual([
      "week-20-overview",
      "week-20-day-3",
    ]);
  });
});
