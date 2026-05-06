import {
  buildMobileWeeksPayload,
  normalizeWeeklyEncyclopediaRows,
} from "./weekly-encyclopedia";

describe("weekly encyclopedia payload", () => {
  test("combines active encyclopedia rows with source weeks and document links", () => {
    const payload = buildMobileWeeksPayload({
      sourceWeeks: [
        {
          week_number: 19,
          title: "19주차 원본",
          baby_size_label: "망고",
          baby_summary: "원본 아기 요약",
          mother_summary: "원본 엄마 요약",
        },
      ],
      encyclopediaRows: normalizeWeeklyEncyclopediaRows([
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
          category: "reflection_question",
          title: "생각해볼 질문",
          summary: "오늘 몸의 변화를 적어봐요.",
          body: "어떤 순간에 편안했는지도 함께 적어봐요.",
          items: ["오늘 좋았던 몸의 신호는 무엇인가요?"],
        },
      ]),
      documentLinks: [
        {
          id: "550e8400-e29b-41d4-a716-446655440019",
          pregnancy_week: 19,
        },
      ],
    });

    expect(payload).toEqual({
      weeks: [
        expect.objectContaining({
          weekNumber: 19,
          linkEntityId: "550e8400-e29b-41d4-a716-446655440019",
          title: "19주차: 오감 발달",
          babySizeLabel: "망고",
          babySummary: "아기가 자라요.\n\n아기 본문",
          motherSummary: "원본 엄마 요약",
          reflectionQuestion: {
            title: "생각해볼 질문",
            summary: "오늘 몸의 변화를 적어봐요.",
            body: "어떤 순간에 편안했는지도 함께 적어봐요.",
            items: ["오늘 좋았던 몸의 신호는 무엇인가요?"],
          },
        }),
      ],
    });
  });
});
