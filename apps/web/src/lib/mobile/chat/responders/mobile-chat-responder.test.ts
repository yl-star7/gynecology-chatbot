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

  it("falls back when workflow output is not structured chat JSON", async () => {
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
          outputs: { text: "SPECIAL INSTRUCTION" },
        },
      }),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: SPECIAL INSTRUCTION",
      loadCharacterImages: async () => ({}),
      runFallbackModel: jest.fn().mockResolvedValue(fallbackMessage),
    });

    const result = await responder({
      promptContext: null,
      currentWeek: 13,
      normalizedSessionId: "session-1",
      text: "오늘은 마음이 불안해요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(result.assistantMessage).toEqual(fallbackMessage);
    expect(result.workflowMemoryPayload).toBeNull();
  });

  it("returns a local workflow fallback when the fallback model also fails", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockRejectedValue(new Error("No output specified.")),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: workflow 출력이 없어요.",
      loadCharacterImages: async () => ({}),
      runFallbackModel: jest.fn().mockRejectedValue(new Error("No output specified.")),
    });

    const result = await responder({
      promptContext: null,
      currentWeek: 40,
      normalizedSessionId: "session-1",
      text: "오늘은 마음이 불안해요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(result.assistantMessage.characterTone).toBe("anxious");
    expect(result.assistantMessage.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "quickReplies" }),
      ]),
    );
    expect(result.workflowMemoryPayload).toBeNull();
  });
});
