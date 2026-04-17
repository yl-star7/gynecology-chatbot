import {
  buildMemorySystemBlock,
  buildWorkflowAssistantMessage,
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

  it("returns workflow answer with guardrail text and quick replies", async () => {
    const message = await buildWorkflowAssistantMessage({
      run: {
        outputs: {
          answer: JSON.stringify({
            answer: "무리하지 말고 쉬어보세요.",
            guardrailStatus: "medical_caution",
            guardrailReason: "응급 신호 가능성을 먼저 확인해야 해요.",
            characterTone: "anxious",
            quickReplies: [
              { label: "쉬어볼게요", message: "일단 쉬어볼게요" },
              { label: "계속 아파요", message: "계속 아파요" },
            ],
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
          type: "text",
          text: expect.stringContaining("응급 신호 가능성"),
        }),
        expect.objectContaining({
          type: "text",
          text: "무리하지 말고 쉬어보세요.",
        }),
        expect.objectContaining({
          type: "quickReplies",
          choices: [
            expect.objectContaining({ label: "쉬어볼게요" }),
            expect.objectContaining({ label: "계속 아파요" }),
          ],
        }),
      ]),
    );
  });
});
