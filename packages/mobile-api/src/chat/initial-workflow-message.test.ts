import {
  createInitialWorkflowMessageFromPrompt,
  resolveSelectedMoodEntry,
} from "./initial-workflow-message";

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
          label: "직접 말하고 싶어요",
          message: "직접 말하고 싶어요.",
        },
      ]);
    }
  });

  it("normalizes stale remote mood copy before exposing choices", () => {
    const message = createInitialWorkflowMessageFromPrompt(
      JSON.stringify({
        scenario: "mood_intake",
        promptText: "오늘은 마음이 어떠세요?",
        moodPrompts: [
          { label: "좋아요", message: "기분이 좋아요.", tone: "joyful" },
          { label: "울적해요", message: "기분이 울적해요.", tone: "sad" },
          { label: "슬퍼요", message: "기분이 슬퍼요.", tone: "sad" },
          { label: "짜증나요", message: "오늘은 조금 짜증이 나요.", tone: "anxious" },
          { label: "직접 입력", message: "직접 말하고 싶어요.", tone: "calm" },
        ],
      }),
    );

    const quickReplies = message.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quickReplies?.type).toBe("quickReplies");
    if (quickReplies?.type === "quickReplies") {
      expect(quickReplies.choices.map((choice) => choice.message)).toEqual([
        "오늘은 좋은 기분이에요.",
        "오늘은 울적한 기분이에요.",
        "오늘은 슬픈 기분이에요.",
        "오늘은 짜증나는 기분이에요.",
        "직접 말하고 싶어요.",
      ]);
      expect(quickReplies.choices[4]).toEqual({
        id: "initial-workflow-direct",
        label: "직접 말하고 싶어요",
        message: "직접 말하고 싶어요.",
      });
    }
  });

  it("treats first free-text emotion as direct input instead of matching stale mood messages", async () => {
    const entry = await resolveSelectedMoodEntry({
      text: "오늘은 울적한 기분이에요.",
      selectedMoodTone: null,
      canInferFreeTextMood: true,
      moodPool: [
        { label: "울적해요", message: "오늘은 울적한 기분이에요.", tone: "sad" },
      ],
      classifyMoodTone: async () => "sad",
    });

    expect(entry).toEqual({
      label: "직접 입력",
      message: "오늘은 울적한 기분이에요.",
      tone: "sad",
    });
  });

  it("keeps tapped mood choices separate from direct free text", async () => {
    const entry = await resolveSelectedMoodEntry({
      text: "오늘은 울적한 기분이에요.",
      selectedMoodTone: "sad",
      canInferFreeTextMood: true,
      moodPool: [
        { label: "울적해요", message: "오늘은 울적한 기분이에요.", tone: "sad" },
      ],
      classifyMoodTone: async () => "joyful",
    });

    expect(entry).toEqual({
      label: "울적해요",
      message: "오늘은 울적한 기분이에요.",
      tone: "sad",
    });
  });
});
