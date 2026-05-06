import { toRecordDayView } from "./serializers";

describe("toRecordDayView", () => {
  it("returns read-only related sessions with chat-window summaries as previews", () => {
    const recordDay = toRecordDayView({
      isoDate: "2026-04-20",
      infoViewed: false,
      emotionTone: null,
      checklistItems: [],
      conversationSummary: "그날의 전체 요약이에요.",
      dailyQuestions: [],
      records: [],
      relatedSessions: [
        {
          id: "session-1",
          title: "기분과 질문 대화",
          last_message_at: "2026-04-20T10:00:00.000Z",
          last_message_preview: "마지막 메시지",
          summary: "기분과 날짜 질문을 간략히 정리했어요.",
        },
      ],
    });

    expect(recordDay).toEqual(
      expect.objectContaining({
        conversationSummary: "그날의 전체 요약이에요.",
        relatedSessions: [
          expect.objectContaining({
            id: "session-1",
            preview: "기분과 날짜 질문을 간략히 정리했어요.",
            summary: "기분과 날짜 질문을 간략히 정리했어요.",
            isReadOnly: true,
          }),
        ],
      }),
    );
  });
});
