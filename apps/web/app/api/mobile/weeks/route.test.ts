jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      { status: 500 },
    ),
  ),
}));

jest.mock("@gynecology-chatbot/db/prisma", () => ({
  prisma: {
    v_weekly_encyclopedia: {
      findMany: jest.fn(),
    },
    content_pregnancy_week_data: {
      findMany: jest.fn(),
    },
    content_pregnancy_documents: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "@gynecology-chatbot/db/prisma";
import { requireMobileSession } from "@/lib/mobile/session-auth";
import { GET } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedPrisma = prisma as unknown as {
  v_weekly_encyclopedia: { findMany: jest.Mock };
  content_pregnancy_week_data: { findMany: jest.Mock };
  content_pregnancy_documents: { findMany: jest.Mock };
};

describe("GET /api/mobile/weeks", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedPrisma.v_weekly_encyclopedia.findMany.mockReset();
    mockedPrisma.content_pregnancy_week_data.findMany.mockReset();
    mockedPrisma.content_pregnancy_documents.findMany.mockReset();
    mockedPrisma.content_pregnancy_documents.findMany.mockResolvedValue([]);
  });

  test("uses active paraphrased encyclopedia rows before source week rows", async () => {
    mockedPrisma.v_weekly_encyclopedia.findMany.mockResolvedValue([
      {
        week_number: 19,
        content_scope: "week_summary",
        category: "overview",
        title: "19주차: 오감 발달",
        summary: "아기의 감각이 발달해요.",
        body: "요약 본문",
        items: [],
      },
      {
        week_number: 19,
        content_scope: "section",
        category: "baby_development",
        title: "아기 성장 이야기",
        summary: "아기가 자라요.",
        body: "아기 본문",
        items: [],
      },
      {
        week_number: 19,
        content_scope: "section",
        category: "mother_body",
        title: "엄마 몸 변화",
        summary: "배가 더 둥글어져요.",
        body: "엄마 본문",
        items: [],
      },
      {
        week_number: 19,
        content_scope: "section",
        category: "life_guide",
        title: "생활 가이드",
        summary: "물을 충분히 마셔요.",
        body: "생활 본문",
        items: ["물 마시기"],
      },
      {
        week_number: 19,
        content_scope: "section",
        category: "caution",
        title: "주의할 점",
        summary: "통증이 심하면 상담해요.",
        body: "주의 본문",
        items: ["강한 통증"],
      },
      {
        week_number: 19,
        content_scope: "section",
        category: "reflection_question",
        title: "생각해볼 질문",
        summary: "오늘 몸의 변화를 적어봐요.",
        body: "어떤 순간에 편안했는지도 함께 적어봐요.",
        items: ["오늘 좋았던 몸의 신호는 무엇인가요?"],
      },
      {
        week_number: 19,
        content_scope: "section",
        category: "faq",
        title: "궁금해요",
        summary: null,
        body: null,
        items: [
          {
            question: "배 모양이 달라도 괜찮나요?",
            answer: "개인차가 있어요.",
          },
        ],
      },
    ]);
    mockedPrisma.content_pregnancy_week_data.findMany.mockResolvedValue([
      {
        week_number: 19,
        title: "19주차 원본",
        baby_size_label: "망고",
        baby_summary: "원본 아기 요약",
        mother_summary: "원본 엄마 요약",
      },
    ]);
    mockedPrisma.content_pregnancy_documents.findMany.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440019",
        pregnancy_week: 19,
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/mobile/weeks") as never,
    );

    expect(
      mockedPrisma.content_pregnancy_documents.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pregnancy_week: { not: null } },
        orderBy: [{ pregnancy_week: "asc" }, { updated_at: "desc" }],
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      weeks: [
        {
          weekNumber: 19,
          linkEntityId: "550e8400-e29b-41d4-a716-446655440019",
          title: "19주차: 오감 발달",
          babySizeLabel: "망고",
          babySummary: "아기가 자라요.\n\n아기 본문",
          motherSummary: "배가 더 둥글어져요.\n\n엄마 본문",
          lifeGuide: {
            title: "생활 가이드",
            summary: "물을 충분히 마셔요.",
            body: "생활 본문",
            items: ["물 마시기"],
          },
          caution: {
            title: "주의할 점",
            summary: "통증이 심하면 상담해요.",
            body: "주의 본문",
            items: ["강한 통증"],
          },
          reflectionQuestion: {
            title: "생각해볼 질문",
            summary: "오늘 몸의 변화를 적어봐요.",
            body: "어떤 순간에 편안했는지도 함께 적어봐요.",
            items: ["오늘 좋았던 몸의 신호는 무엇인가요?"],
          },
          faq: {
            title: "궁금해요",
            items: [
              {
                question: "배 모양이 달라도 괜찮나요?",
                answer: "개인차가 있어요.",
              },
            ],
          },
        },
      ],
    });
  });

  test("falls back to source week rows when no paraphrased rows are active", async () => {
    mockedPrisma.v_weekly_encyclopedia.findMany.mockResolvedValue([]);
    mockedPrisma.content_pregnancy_week_data.findMany.mockResolvedValue([
      {
        week_number: 20,
        title: "20주차 발달 정보",
        baby_size_label: "바나나",
        baby_summary: "원본 아기 요약",
        mother_summary: "원본 엄마 요약",
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/mobile/weeks") as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      weeks: [
        {
          weekNumber: 20,
          linkEntityId: null,
          title: "20주차 발달 정보",
          babySizeLabel: "바나나",
          babySummary: "원본 아기 요약",
          motherSummary: "원본 엄마 요약",
        },
      ],
    });
  });

  test("keeps source weeks navigable when paraphrased encyclopedia rows are partial", async () => {
    mockedPrisma.v_weekly_encyclopedia.findMany.mockResolvedValue([
      {
        week_number: 19,
        content_scope: "section",
        category: "baby_development",
        title: "아기 성장 이야기",
        summary: "다듬은 19주 아기 요약",
        body: "아기 본문",
        items: [],
      },
    ]);
    mockedPrisma.content_pregnancy_week_data.findMany.mockResolvedValue([
      {
        week_number: 19,
        title: "19주차 원본",
        baby_size_label: "망고",
        baby_summary: "원본 19주 아기 요약",
        mother_summary: "원본 19주 엄마 요약",
      },
      {
        week_number: 20,
        title: "20주차 원본",
        baby_size_label: "바나나",
        baby_summary: "원본 20주 아기 요약",
        mother_summary: "원본 20주 엄마 요약",
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/mobile/weeks") as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      weeks: [
        expect.objectContaining({
          weekNumber: 19,
          linkEntityId: null,
          title: "19주차 원본",
          babySizeLabel: "망고",
          babySummary: "다듬은 19주 아기 요약\n\n아기 본문",
          motherSummary: "원본 19주 엄마 요약",
        }),
        expect.objectContaining({
          weekNumber: 20,
          linkEntityId: null,
          title: "20주차 원본",
          babySizeLabel: "바나나",
          babySummary: "원본 20주 아기 요약",
          motherSummary: "원본 20주 엄마 요약",
        }),
      ],
    });
  });
});
