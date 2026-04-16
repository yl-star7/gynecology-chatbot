import type { ChatMessage } from "@gynecology-chatbot/app-core";

import {
  buildMemorySystemBlock,
  buildWorkflowAssistantMessage,
  parseAssistantResponseWithRetry,
  pickLatestEmotionTone,
} from "./route-response-helpers";

describe("route response helpers", () => {
  it("prefers profile emotion tone over session tone", () => {
    expect(
      pickLatestEmotionTone({
        sessionMemory: { lastEmotionTone: "tired" },
        profileMemory: { lastEmotionTone: "anxious" },
      }),
    ).toBe("anxious");
  });

  it("builds memory system block with available lines only", () => {
    expect(
      buildMemorySystemBlock({
        compactSummary: "최근 복통 상담",
        lastScenario: "symptom_counsel",
        lastCharacterTone: null,
        lastEmotionTone: "tired",
        tonePreference: "차분하게",
      }),
    ).toBe(
      [
        "최근 세션 요약: 최근 복통 상담",
        "직전 상담 분기: symptom_counsel",
        "최근 감정 톤: tired",
        "사용자 선호 상담 분위기: 차분하게",
      ].join("\n"),
    );
  });

  it("retries invalid JSON and succeeds on second attempt", async () => {
    const generate = jest
      .fn<Promise<string>, []>()
      .mockResolvedValueOnce("일반 텍스트")
      .mockResolvedValueOnce(
        JSON.stringify({
          id: "assistant-1",
          role: "assistant",
          createdAtLabel: "방금 전",
          parts: [{ type: "text", id: "p1", text: "정상 응답" }],
        }),
      );

    const result = await parseAssistantResponseWithRetry({ generate });

    expect(generate).toHaveBeenCalledTimes(2);
    expect(result.parts[0]).toEqual(
      expect.objectContaining({ type: "text", text: "정상 응답" }),
    );
  });

  it("throws after all retry attempts are exhausted", async () => {
    const generate = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue("파싱 불가능한 텍스트");

    await expect(
      parseAssistantResponseWithRetry({ generate, maxAttempts: 3 }),
    ).rejects.toThrow("AI 응답 파싱이 3회 연속 실패했습니다");

    expect(generate).toHaveBeenCalledTimes(3);
  });

  it("returns workflow answer with guardrail text and character image", async () => {
    const message = await buildWorkflowAssistantMessage({
      run: {
        outputs: {
          answer: JSON.stringify({
            answer: "무리하지 말고 쉬어보세요.",
            guardrailStatus: "medical_caution",
            guardrailReason: "응급 신호 가능성을 먼저 확인해야 해요.",
            characterTone: "anxious",
          }),
        },
      },
      loadCharacterImages: async () => ({}),
      extractOutputs: (run) => run.outputs as Record<string, unknown>,
    });

    expect(message).not.toBeNull();
    expect(message?.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "image",
          alt: expect.stringContaining("안내"),
        }),
        expect.objectContaining({
          type: "text",
          text: expect.stringContaining("응급 신호 가능성"),
        }),
        expect.objectContaining({
          type: "text",
          text: "무리하지 말고 쉬어보세요.",
        }),
      ]),
    );
  });
});
