import {
  buildChecklistLabel,
  buildConversationSummary,
  buildSessionSummaryById,
  type CalendarRecordRow,
} from "./record-day-route-helpers";

describe("record-day-route-helpers", () => {
  it("prefers finalized daily conversation summaries before chat placeholders", () => {
    const records: CalendarRecordRow[] = [
      {
        id: "chat-1",
        title: "대화",
        summary: "현재 단계: 질문 답변 대기",
        entry_type: "chat_saved",
        session_id: "session-1",
        payload: { compactSummary: "현재 단계: 질문 답변 대기" },
      },
      {
        id: "summary-1",
        title: "하루 요약",
        summary:
          "오늘은 배가 묵직했고, 아기가 잘 자라고 있다는 안도감을 남겼어요.",
        entry_type: "ai_summary",
        session_id: null,
        payload: { source: "daily_conversation_summary" },
      },
    ];

    expect(buildConversationSummary(records, [])).toBe(
      "오늘은 배가 묵직했고, 아기가 잘 자라고 있다는 안도감을 남겼어요.",
    );
  });

  it("strips inline citation markers from checklist labels", () => {
    expect(
      buildChecklistLabel({
        id: "check-1",
        title: "물을 충분히 마셔요. (1)(2)",
        description: "설명",
        display_order: 1,
      }),
    ).toBe("물을 충분히 마셔요.");
  });

  it("keeps session summaries keyed by session id and ignores daily summaries", () => {
    const summaries = buildSessionSummaryById([
      {
        id: "day-summary",
        title: "하루 요약",
        summary: "하루 전체 요약",
        entry_type: "ai_summary",
        session_id: null,
        payload: { source: "daily_conversation_summary" },
      },
      {
        id: "session-summary",
        title: "세션 요약",
        summary: "질문에 차분하게 답했어요.",
        entry_type: "ai_summary",
        session_id: "session-1",
        payload: { source: "session_summary" },
      },
    ]);

    expect(summaries.get("session-1")).toBe("질문에 차분하게 답했어요.");
  });
});
