import type { ChatMessage } from "@gynecology-chatbot/app-core";

import {
  buildMemorySystemBlock,
  buildWorkflowAssistantMessage,
  pickLatestEmotionTone,
} from "./route-response-helpers";

function getTextParts(message: ChatMessage) {
  return message.parts.flatMap((part) =>
    part.type === "text" ? [part.text] : [],
  );
}

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

  it("promotes attachment questions from answer text into quick replies", async () => {
    const message = await buildWorkflowAssistantMessage({
      run: {
        outputs: {
          answer: JSON.stringify({
            answer:
              "오늘 해본 만큼으로도 충분해요.\n\n- 아기에게 물려주고 싶은 가치는 무엇인가요?\n- 아기에게 가장 먼저 가르쳐주고 싶은 것은 무엇인가요?",
            characterTone: "calm",
            scenario: "attachment_question",
          }),
        },
      },
      loadCharacterImages: async () => ({}),
      extractOutputs: (run) => run.outputs as Record<string, unknown>,
    });

    const text = getTextParts(message!).join("\n");
    const quickReplies = message?.parts.find(
      (part) => part.type === "quickReplies",
    );

    expect(text).toBe("오늘 해본 만큼으로도 충분해요.");
    expect(quickReplies).toEqual(
      expect.objectContaining({
        choices: [
          expect.objectContaining({
            label: "아기에게 물려주고 싶은 가치는 무엇인가요?",
          }),
          expect.objectContaining({
            label: "아기에게 가장 먼저 가르쳐주고 싶은 것은 무엇인가요?",
          }),
        ],
      }),
    );
  });

  it("adds scenario quick replies when workflow omits them", async () => {
    const message = await buildWorkflowAssistantMessage({
      run: {
        outputs: {
          answer: JSON.stringify({
            answer: "28주차 아기 소식을 짧게 볼게요.",
            characterTone: "calm",
            scenario: "baby_info",
          }),
        },
      },
      loadCharacterImages: async () => ({}),
      extractOutputs: (run) => run.outputs as Record<string, unknown>,
    });

    const quickReplies = message?.parts.find(
      (part) => part.type === "quickReplies",
    );

    expect(quickReplies).toEqual(
      expect.objectContaining({
        choices: [
          expect.objectContaining({ label: "오늘의 질문" }),
          expect.objectContaining({ label: "이따가요" }),
        ],
      }),
    );
  });

});
