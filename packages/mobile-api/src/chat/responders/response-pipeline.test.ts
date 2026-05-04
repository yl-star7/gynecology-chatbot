import type { ChatMessage } from "@gynecology-chatbot/app-core";

import { resolveAssistantResponse } from "./response-pipeline";

describe("response pipeline", () => {
  let infoSpy: jest.SpiedFunction<typeof console.info>;
  let warnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("returns hard guardrail message without calling workflow", async () => {
    const runWorkflow = jest.fn();

    const result = await resolveAssistantResponse({
      hardGuardrailReason: "상처를 주는 표현에는 답변하지 않고 있어요.",
      workflowEnabled: true,
      runWorkflow,
    });

    expect(runWorkflow).not.toHaveBeenCalled();
    expect(result.assistantMessage.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "text",
          text: expect.stringContaining("안전 안내:"),
        }),
      ]),
    );
    expect(result.workflowMemoryPayload).toBeNull();
    expect(infoSpy).toHaveBeenCalledWith(
      "mobile chat response: hard guardrail response",
    );
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
    });

    expect(result.assistantMessage).toEqual(workflowMessage);
    expect(result.workflowMemoryPayload).toEqual(
      expect.objectContaining({
        nextSessionMemory: expect.objectContaining({ compactSummary: "요약" }),
      }),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      "mobile chat response: workflow start",
    );
    expect(infoSpy).toHaveBeenCalledWith(
      "mobile chat response: workflow success",
    );
  });

  it("throws when workflow throws", async () => {
    const workflowError = new Error("workflow failed");

    await expect(
      resolveAssistantResponse({
        hardGuardrailReason: null,
        workflowEnabled: true,
        runWorkflow: jest.fn().mockRejectedValue(workflowError),
      }),
    ).rejects.toThrow(workflowError);

    expect(warnSpy).toHaveBeenCalledWith(
      "mobile chat response: workflow failed",
      expect.objectContaining({
        error: expect.objectContaining({ message: "workflow failed" }),
      }),
    );
  });

  it("does not use local fallback for workflow failures", async () => {
    const workflowError = new Error("File RAG search failed: Bucket search failed");
    const fallbackResponse = jest.fn().mockResolvedValue({
      assistantMessage: {
        id: "assistant-fallback",
        role: "assistant",
        createdAtLabel: "방금 전",
        parts: [{ type: "text", id: "p1", text: "로컬 fallback" }],
      } satisfies ChatMessage,
      workflowMemoryPayload: null,
    });

    await expect(
      resolveAssistantResponse({
        hardGuardrailReason: null,
        workflowEnabled: true,
        runWorkflow: jest.fn().mockRejectedValue(workflowError),
        fallbackResponse,
      }),
    ).rejects.toThrow("Bucket search failed");

    expect(fallbackResponse).not.toHaveBeenCalled();
  });

  it("throws when workflow is disabled", async () => {
    const runWorkflow = jest.fn();
    const fallbackResponse = jest.fn();

    await expect(
      resolveAssistantResponse({
        hardGuardrailReason: null,
        workflowEnabled: false,
        runWorkflow,
        fallbackResponse,
      }),
    ).rejects.toThrow("Mobile chat workflow is unavailable");

    expect(runWorkflow).not.toHaveBeenCalled();
    expect(fallbackResponse).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "mobile chat response: workflow unavailable",
      expect.objectContaining({
        error: expect.objectContaining({
          message: "Mobile chat workflow is unavailable",
        }),
      }),
    );
  });
});
