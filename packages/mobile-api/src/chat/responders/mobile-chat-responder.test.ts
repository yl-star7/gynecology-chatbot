import { createMobileChatResponder } from "./mobile-chat-responder";

describe("mobile chat responder", () => {
  it("passes memory context into workflow inputs", async () => {
    const runWorkflow = jest.fn().mockResolvedValue({
      run: {
        status: "completed",
        outputs: { answer: "workflow 답변" },
      },
    });

    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: runWorkflow,
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: workflow 답변",
      loadCharacterImages: async () => ({}),
    });

    await responder({
      promptContext: {
        pregnancyWeek: 13,
        dayNumber: 1,
        week: {
          id: "week-13",
          week_number: 13,
          title: "13주차",
          baby_summary: null,
          mother_summary: null,
          warning_signs: null,
          recommended_actions: null,
          checklist_intro: null,
          question_intro: null,
          status: "published",
        },
        dayContent: null,
        checklists: [],
        questions: [],
        tonePreference: "차분하게",
        profileMemory: {
          lastEmotionTone: "tired",
          personaHint: "practical",
          personaConfidence: "medium",
        },
        sessionMemory: {
          compactSummary: "최근 복통 상담",
          lastScenario: "symptom_counsel",
          lastCharacterTone: "anxious",
        },
        onboardingPayload: null,
        missingFields: [],
      },
      currentWeek: 13,
      normalizedSessionId: "session-1",
      text: "배가 아파요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(runWorkflow).toHaveBeenCalledWith({
      schift: expect.any(Object),
      inputs: expect.objectContaining({
        compactSummary: "최근 복통 상담",
        lastScenario: "symptom_counsel",
        lastCharacterTone: "anxious",
        lastEmotionTone: "tired",
        personaHint: "practical",
        personaConfidence: "medium",
        tonePreference: "차분하게",
      }),
    });
  });

  it("throws when workflow output is empty", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockResolvedValue({
        run: {
          status: "completed",
          outputs: {},
        },
      }),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: {}",
      loadCharacterImages: async () => ({}),
    });

    await expect(
      responder({
        promptContext: null,
        currentWeek: 13,
        normalizedSessionId: "session-1",
        text: "배가 아파요",
        imageDataUris: [],
        hardGuardrailReason: null,
      }),
    ).rejects.toThrow("Schift workflow returned empty output");
  });

  it("throws when workflow output is not structured chat JSON", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockResolvedValue({
        run: {
          status: "completed",
          outputs: { text: "SPECIAL INSTRUCTION" },
        },
      }),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: SPECIAL INSTRUCTION",
      loadCharacterImages: async () => ({}),
    });

    await expect(
      responder({
        promptContext: null,
        currentWeek: 13,
        normalizedSessionId: "session-1",
        text: "오늘은 마음이 불안해요",
        imageDataUris: [],
        hardGuardrailReason: null,
      }),
    ).rejects.toThrow("Schift workflow returned unstructured output");
  });

  it("removes early closing quick replies during letter reflection flow", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockResolvedValue({
        run: {
          status: "completed",
          outputs: {
            answer: JSON.stringify({
              answer: "아기에게 따뜻한 마음을 잘 전하셨어요.",
              scenario: "letter_reflection",
              quickReplies: [
                { label: "오늘은 여기까지", message: "오늘은 여기까지" },
                { label: "더 이야기하기", message: "더 이야기하기" },
              ],
              nextSessionMemory: {
                compactSummary: "현재 단계: 편지 후속 질문",
                lastScenario: "letter_reflection",
              },
            }),
          },
        },
      }),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: ok",
      loadCharacterImages: async () => ({}),
    });

    const result = await responder({
      promptContext: null,
      currentWeek: 28,
      normalizedSessionId: "session-1",
      text: "아기에게 편지를 썼어요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    const quickReplies = result.assistantMessage.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quickReplies).toBeUndefined();
    const textPart = result.assistantMessage.parts.find(
      (part) => part.type === "text",
    );
    expect(textPart?.type).toBe("text");
    if (textPart?.type === "text") {
      expect(textPart.text).toContain("가장 크게 남은 마음은 무엇이었나요?");
    }
  });

  it("throws when workflow execution fails", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest
        .fn()
        .mockRejectedValue(new Error("No output specified.")),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: workflow 출력이 없어요.",
      loadCharacterImages: async () => ({}),
    });

    await expect(
      responder({
        promptContext: null,
        currentWeek: 40,
        normalizedSessionId: "session-1",
        text: "오늘은 마음이 불안해요",
        imageDataUris: [],
        hardGuardrailReason: null,
      }),
    ).rejects.toThrow("No output specified.");
  });
});
