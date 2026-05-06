import { createInitialWorkflowMessageFromPrompt } from "./initial-workflow-message";

describe("initial workflow message", () => {
  it("builds the mobile initial mood choices from workflow prompt JSON", () => {
    const message = createInitialWorkflowMessageFromPrompt(
      JSON.stringify({
        scenario: "mood_intake",
        promptText: "오늘은 마음이 어떠세요?",
        moodPrompts: [
          {
            label: "좋아요",
            message: "오늘은 좋은 기분이에요.",
            tone: "joyful",
          },
          {
            label: "우울해요",
            message: "오늘은 우울한 기분이에요.",
            tone: "sad",
          },
          {
            label: "슬퍼요",
            message: "오늘은 슬픈 기분이에요.",
            tone: "sad",
          },
          {
            label: "화나요",
            message: "오늘은 화나는 기분이에요.",
            tone: "anxious",
          },
          {
            label: "직접 입력",
            message: "직접 말하고 싶어요.",
            tone: "calm",
          },
        ],
      }),
    );

    expect(message.role).toBe("assistant");
    expect(message.characterTone).toBe("calm");
    expect(message.parts.map((part) => part.type)).toEqual([
      "text",
      "quickReplies",
    ]);

    const quickReplies = message.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quickReplies?.type).toBe("quickReplies");
    if (quickReplies?.type === "quickReplies") {
      expect(quickReplies.choices).toEqual([
        {
          id: "initial-workflow-good",
          label: "좋아요",
          message: "오늘은 좋은 기분이에요.",
          moodTone: "joyful",
        },
        {
          id: "initial-workflow-down",
          label: "우울해요",
          message: "오늘은 우울한 기분이에요.",
          moodTone: "sad",
        },
        {
          id: "initial-workflow-sad",
          label: "슬퍼요",
          message: "오늘은 슬픈 기분이에요.",
          moodTone: "sad",
        },
        {
          id: "initial-workflow-angry",
          label: "화나요",
          message: "오늘은 화나는 기분이에요.",
          moodTone: "anxious",
        },
        {
          id: "initial-workflow-direct",
          label: "직접 입력",
          message: "직접 말하고 싶어요.",
        },
      ]);
    }
  });
});
