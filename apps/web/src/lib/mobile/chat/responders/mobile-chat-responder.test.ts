import type { ChatMessage } from "@gynecology-chatbot/app-core";

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
      runFallbackModel: jest.fn(),
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
        profileMemory: { lastEmotionTone: "tired" },
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
        tonePreference: "차분하게",
      }),
    });
  });

  it("falls back when workflow output is empty", async () => {
    const fallbackMessage: ChatMessage = {
      id: "assistant-fallback",
      role: "assistant",
      createdAtLabel: "방금 전",
      parts: [{ type: "text", id: "p1", text: "fallback 답변" }],
    };

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
      runFallbackModel: jest.fn().mockResolvedValue(fallbackMessage),
    });

    const result = await responder({
      promptContext: null,
      currentWeek: 13,
      normalizedSessionId: "session-1",
      text: "배가 아파요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(result.assistantMessage).toEqual(fallbackMessage);
    expect(result.workflowMemoryPayload).toBeNull();
  });
});
