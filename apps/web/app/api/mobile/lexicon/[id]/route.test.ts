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
      findFirst: jest.fn(),
    },
    content_pregnancy_day_contents: {
      findFirst: jest.fn(),
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

function buildContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

const WEEK_20 = {
  id: "week-row-20",
  week_number: 20,
  title: "20주차",
  baby_summary: "아기가 더 활발히 움직여요.",
  mother_summary: "태동을 느끼는 날이 늘 수 있어요.",
  warning_signs: null,
  recommended_actions: "태동 느낌을 편하게 기록해요.",
};

const DAY_20_3 = {
  id: "day-row-20-3",
  week_data_id: "week-row-20",
  day_number: 3,
  title: "태동 기록",
  baby_message: "작은 움직임으로 인사할 수 있어요.",
  baby_development_payload: { items: ["움직임이 더 또렷해져요."] },
  mother_changes_payload: { items: ["배가 당기는 느낌이 있을 수 있어요."] },
};

beforeEach(() => {
  mockedRequireMobileSession.mockReset();
  mockedPrisma.content_pregnancy_week_data.findFirst.mockReset();
  mockedPrisma.content_pregnancy_day_contents.findFirst.mockReset();
  mockedPrisma.content_week_checklists.findMany.mockReset();
  mockedPrisma.content_week_questions.findMany.mockReset();

  mockedRequireMobileSession.mockResolvedValue({
    userId: "user-1",
    sessionId: "session-1",
  } as never);
  mockedPrisma.content_pregnancy_week_data.findFirst.mockResolvedValue(WEEK_20);
  mockedPrisma.content_pregnancy_day_contents.findFirst.mockResolvedValue(
    DAY_20_3,
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
});

describe("GET /api/mobile/lexicon/[id]", () => {
  test("returns a generated week overview markdown document", async () => {
    const response = await GET(
      buildRequest("http://localhost/api/mobile/lexicon/week-20-overview", {
        authorization: "Bearer t",
      }),
      buildContext("week-20-overview"),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      id: string;
      week: number | null;
      day: number | null;
      surface: string | null;
      content: string;
    };

    expect(payload).toEqual(
      expect.objectContaining({
        id: "week-20-overview",
        week: 20,
        day: null,
        surface: "week_overview",
      }),
    );
    expect(payload.content).toContain("# 임신 20주차 정보");
    expect(payload.content).toContain("아기 요약: 아기가 더 활발히 움직여요.");
  });

  test("returns a generated day markdown document with checklist and question", async () => {
    const response = await GET(
      buildRequest("http://localhost/api/mobile/lexicon/week-20-day-3", {
        authorization: "Bearer t",
      }),
      buildContext("week-20-day-3"),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      id: string;
      title: string;
      week: number | null;
      day: number | null;
      surface: string | null;
      content: string;
    };

    expect(payload).toEqual(
      expect.objectContaining({
        id: "week-20-day-3",
        title: "임신 20주 2일: 태동 기록",
        week: 20,
        day: 3,
        surface: "week_day",
      }),
    );
    expect(payload.content).toContain("# 임신 20주 2일");
    expect(payload.content).toContain("## 생활 체크리스트");
    expect(payload.content).toContain(
      "- 태동 느낌 기록하기: 편안한 시간에 짧게 적어봐요.",
    );
    expect(payload.content).toContain("## 태교 질문");
    expect(payload.content).toContain(
      "- 오늘 가장 편안했던 순간은 언제였나요?",
    );
  });

  test("invalid generated id returns 400", async () => {
    const response = await GET(
      buildRequest("http://localhost/api/mobile/lexicon/not-a-document", {
        authorization: "Bearer t",
      }),
      buildContext("not-a-document"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "잘못된 자료 식별자에요.",
    });
  });

  test("missing generated document returns 404", async () => {
    mockedPrisma.content_pregnancy_day_contents.findFirst.mockResolvedValueOnce(
      null,
    );

    const response = await GET(
      buildRequest("http://localhost/api/mobile/lexicon/week-20-day-3", {
        authorization: "Bearer t",
      }),
      buildContext("week-20-day-3"),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "자료를 찾지 못했어요.",
    });
  });
});
