import {
  buildQuestionSummaryRecord,
  buildSummaryText,
  buildTitle,
  shouldSaveQuestionSummary,
} from "./question-summary";

describe("buildSummaryText", () => {
  it("prefers compactSummary without '현재 단계:' prefix", () => {
    expect(
      buildSummaryText({
        compactSummary: "현재 단계: 편지 후속 질문. 아기에게 따뜻한 마음 전함",
        userAnswer: "답변은 길어도 두번째 순위",
      }),
    ).toBe("편지 후속 질문. 아기에게 따뜻한 마음 전함");
  });

  it("falls back to userAnswer when compactSummary is too short", () => {
    expect(
      buildSummaryText({
        compactSummary: "짧음",
        userAnswer:
          "사용자 답변이 길게 들어온다면 이걸 요약으로 사용합니다 한참 적었어요",
      }),
    ).toContain("사용자 답변이 길게");
  });

  it("truncates to 220 chars", () => {
    const summary = buildSummaryText({
      compactSummary: "현재 단계: " + "긴내용".repeat(100),
      userAnswer: "x",
    });
    expect(summary.length).toBeLessThanOrEqual(220);
  });
});

describe("buildTitle", () => {
  it("uses question text up to 40 chars", () => {
    expect(
      buildTitle("오늘 아기에게 들려주고 싶은 말은 무엇인가요?"),
    ).toContain("오늘 아기에게");
  });

  it("falls back when null", () => {
    expect(buildTitle(null)).toBe("오늘의 질문");
  });
});

describe("shouldSaveQuestionSummary", () => {
  it("returns true at stage=2 with new questionId", () => {
    expect(
      shouldSaveQuestionSummary({
        workflowStage: 2,
        selectedQuestionId: "q1",
        alreadyPersistedQuestionIds: new Set(),
      }),
    ).toBe(true);
  });

  it("returns false at other stages", () => {
    expect(
      shouldSaveQuestionSummary({
        workflowStage: 0,
        selectedQuestionId: "q1",
        alreadyPersistedQuestionIds: new Set(),
      }),
    ).toBe(false);
  });

  it("returns false when questionId already persisted today", () => {
    expect(
      shouldSaveQuestionSummary({
        workflowStage: 2,
        selectedQuestionId: "q1",
        alreadyPersistedQuestionIds: new Set(["q1"]),
      }),
    ).toBe(false);
  });

  it("returns false when no questionId", () => {
    expect(
      shouldSaveQuestionSummary({
        workflowStage: 2,
        selectedQuestionId: null,
        alreadyPersistedQuestionIds: new Set(),
      }),
    ).toBe(false);
  });
});

describe("buildQuestionSummaryRecord", () => {
  it("builds a complete record with payload", () => {
    const rec = buildQuestionSummaryRecord({
      userId: "u1",
      sessionId: "s1",
      dateKey: "2026-04-21",
      questionId: "q1",
      questionText: "오늘 아기에게 들려주고 싶은 말은?",
      userAnswer: "엄마는 지금 네가 너무 소중해",
      assistantAnswer: "따뜻한 마음을 잘 전하셨어요.",
      compactSummary: "현재 단계: 편지 후속 질문",
      emotionTone: "calm",
      moodId: "joyful",
      moodLabel: "좋아요",
    });
    expect(rec.entryType).toBe("question_summary");
    expect(rec.userId).toBe("u1");
    expect(rec.payload.questionId).toBe("q1");
    expect(rec.payload.answer).toContain("엄마는");
    expect(rec.payload.aiResponse).toContain("따뜻한");
    expect(rec.payload.source).toBe("attachment_question_followup");
  });
});
