import { parseWorkflowAssistantPayload } from "./workflow-payload";

describe("workflow payload", () => {
  it("keeps document-style quick replies up to five choices", () => {
    const payload = parseWorkflowAssistantPayload({
      answer: JSON.stringify({
        answer: "오늘 기분이 어떠세요?",
        guardrailStatus: "safe",
        characterTone: "calm",
        scenario: "emotion_checkin",
        quickReplies: [
          { label: "좋아요", message: "오늘은 기분이 좋아요" },
          { label: "우울해요", message: "오늘은 조금 우울해요" },
          { label: "슬퍼요", message: "오늘은 슬픈 마음이 들어요" },
          { label: "화나요", message: "오늘은 화가 나는 마음이 있어요" },
          { label: "직접 입력", message: "직접 말하고 싶어요" },
          { label: "초과", message: "이 선택지는 표시하지 않아요" },
        ],
      }),
    });

    expect(payload?.quickReplies).toHaveLength(5);
    expect(payload?.quickReplies?.map((choice) => choice.label)).toEqual([
      "좋아요",
      "우울해요",
      "슬퍼요",
      "화나요",
      "직접 입력",
    ]);
  });
});
