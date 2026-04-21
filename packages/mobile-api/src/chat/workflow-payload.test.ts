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

  it("parses persona hints from workflow profile memory", () => {
    const payload = parseWorkflowAssistantPayload({
      answer: JSON.stringify({
        answer: "기준을 하나씩 확인해볼게요.",
        nextProfileMemory: {
          personaHint: "practical",
          personaConfidence: "medium",
          personaEvidence: "태동 횟수와 정상 기준을 구체적으로 질문함",
        },
      }),
    });

    expect(payload?.nextProfileMemory).toMatchObject({
      personaHint: "practical",
      personaConfidence: "medium",
      personaEvidence: "태동 횟수와 정상 기준을 구체적으로 질문함",
    });
  });

  it("unwraps Schift answer result text payloads", () => {
    const payload = parseWorkflowAssistantPayload({
      result: {
        answer: JSON.stringify({
          text: JSON.stringify({
            answer: "그렇게 느낄 수 있어요.",
            characterTone: "anxious",
            scenario: "emotion_checkin",
            quickReplies: [
              {
                label: "말할래요",
                message: "조금 더 말하고 싶어요.",
              },
            ],
          }),
          sources: [],
        }),
      },
    });

    expect(payload).toEqual(
      expect.objectContaining({
        answer: "그렇게 느낄 수 있어요.",
        characterTone: "anxious",
        scenario: "emotion_checkin",
        quickReplies: [
          { label: "말할래요", message: "조금 더 말하고 싶어요." },
        ],
      }),
    );
  });

  it("parses knowledge deep links from workflow payloads", () => {
    const payload = parseWorkflowAssistantPayload({
      answer: JSON.stringify({
        answer: "28주차 아기 발달을 짧게 볼게요.",
        deepLinks: [
          {
            title: "28주차 아기 발달",
            description: "더 자세한 주차 정보를 볼 수 있어요.",
            target: "knowledge",
            entityId: "550e8400-e29b-41d4-a716-446655440028",
          },
          {
            title: "임의 ID 링크",
            description: "entityId를 제거하고 표시해요.",
            target: "knowledge",
            entityId: "28w_baby_development",
          },
          {
            title: "잘못된 링크",
            description: "표시하지 않아요.",
            target: "external",
          },
        ],
      }),
    });

    expect(payload?.deepLinks).toEqual([
      {
        title: "28주차 아기 발달",
        description: "더 자세한 주차 정보를 볼 수 있어요.",
        target: "knowledge",
        entityId: "550e8400-e29b-41d4-a716-446655440028",
      },
      {
        title: "임의 ID 링크",
        description: "entityId를 제거하고 표시해요.",
        target: "knowledge",
      },
    ]);
  });

  it("parses selected checklist and question ids", () => {
    const payload = parseWorkflowAssistantPayload({
      answer: JSON.stringify({
        answer: "오늘 질문을 골라볼게요.",
        selectedChecklistIds: ["check-1", "check-2", ""],
        selectedQuestionIds: ["question-1"],
      }),
    });

    expect(payload?.selectedChecklistIds).toEqual(["check-1", "check-2"]);
    expect(payload?.selectedQuestionIds).toEqual(["question-1"]);
  });

  it("accepts concrete workflow stage scenarios for session memory", () => {
    const payload = parseWorkflowAssistantPayload({
      answer: JSON.stringify({
        answer: "오늘 할 일을 해보셨어요.",
        scenario: "letter_reflection",
        nextSessionMemory: {
          compactSummary: "현재 단계: 편지 후속 질문",
          lastScenario: "letter_reflection",
          lastCharacterTone: "calm",
        },
      }),
    });

    expect(payload?.scenario).toBe("letter_reflection");
    expect(payload?.nextSessionMemory?.lastScenario).toBe("letter_reflection");
  });

  it("parses workflow v2 stage and mood fields into session memory", () => {
    const payload = parseWorkflowAssistantPayload({
      answer: JSON.stringify({
        answer: "오늘 주차의 산모나 태아 정보가 궁금하세요?",
        scenario: "baby_info_offer",
        nextSessionMemory: {
          workflowVersion: 2,
          stage: 0,
          stageName: "info_opt_in",
          moodId: "tired",
          moodLabel: "피곤해요",
          compactSummary:
            "현재 단계: 정보 확인 제안. 사용자는 오늘 피곤하다고 선택했어요.",
        },
      }),
    });

    expect(payload?.nextSessionMemory).toMatchObject({
      workflowVersion: 2,
      stage: 0,
      stageName: "info_opt_in",
      moodId: "tired",
      moodLabel: "피곤해요",
    });
  });
});
