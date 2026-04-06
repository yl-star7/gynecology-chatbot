import type { ChatMessage } from "@gynecology-chatbot/app-core";

import { resolveAssistantResponse } from "./response-pipeline";

describe("response pipeline", () => {
  it("returns hard guardrail message without calling workflow or fallback", async () => {
    const runWorkflow = jest.fn();
    const runFallback = jest.fn();

    const result = await resolveAssistantResponse({
      hardGuardrailReason: "상처를 주는 표현에는 답변하지 않고 있어요.",
      workflowEnabled: true,
      runWorkflow,
      runFallback,
    });

    expect(runWorkflow).not.toHaveBeenCalled();
    expect(runFallback).not.toHaveBeenCalled();
    expect(result.assistantMessage.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "text",
          text: expect.stringContaining("안전 안내:"),
        }),
      ]),
    );
    expect(result.workflowMemoryPayload).toBeNull();
  });

  it("uses workflow result when workflow returns completed message", async () => {
    const workflowMessage: ChatMessage = {
      id: "assistant-1",
      role: "assistant",
      createdAtLabel: "방금 전",
      parts: [{ type: "text", id: "p1", text: "워크플로우 응답" }],
    };

    const result = await resolveAssistantResponse({
      hardGuardrailReason: null,
      workflowEnabled: true,
      runWorkflow: jest.fn().mockResolvedValue({
        assistantMessage: workflowMessage,
        workflowMemoryPayload: {
          nextSessionMemory: { compactSummary: "요약" },
        },
      }),
      runFallback: jest.fn(),
    });

    expect(result.assistantMessage).toEqual(workflowMessage);
    expect(result.workflowMemoryPayload).toEqual(
      expect.objectContaining({
        nextSessionMemory: expect.objectContaining({ compactSummary: "요약" }),
      }),
    );
  });

  it("falls back when workflow throws", async () => {
    const fallbackMessage: ChatMessage = {
      id: "assistant-fallback",
      role: "assistant",
      createdAtLabel: "방금 전",
      parts: [{ type: "text", id: "p-fallback", text: "폴백 응답" }],
    };

    const result = await resolveAssistantResponse({
      hardGuardrailReason: null,
      workflowEnabled: true,
      runWorkflow: jest.fn().mockRejectedValue(new Error("workflow failed")),
      runFallback: jest.fn().mockResolvedValue(fallbackMessage),
    });

    expect(result.assistantMessage).toEqual(fallbackMessage);
    expect(result.workflowMemoryPayload).toBeNull();
  });

  it("uses fallback directly when workflow is disabled", async () => {
    const fallbackMessage: ChatMessage = {
      id: "assistant-fallback",
      role: "assistant",
      createdAtLabel: "방금 전",
      parts: [{ type: "text", id: "p-fallback", text: "모델 응답" }],
    };

    const runWorkflow = jest.fn();
    const runFallback = jest.fn().mockResolvedValue(fallbackMessage);

    const result = await resolveAssistantResponse({
      hardGuardrailReason: null,
      workflowEnabled: false,
      runWorkflow,
      runFallback,
    });

    expect(runWorkflow).not.toHaveBeenCalled();
    expect(runFallback).toHaveBeenCalled();
    expect(result.assistantMessage).toEqual(fallbackMessage);
  });
});
