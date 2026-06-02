import {
  buildMobileAskPrompt,
  DEFAULT_MOBILE_ASK_PROMPT_CONFIG,
  normalizeMobileAskPromptConfig,
} from "./ask-prompt";

describe("mobile ask prompt", () => {
  test("uses operator controlled tone while keeping fixed safety guardrails", () => {
    const prompt = buildMobileAskPrompt({
      query: "27주 태동은 어느 정도면 괜찮아요?",
      currentWeek: 27,
      contextBlocks: [
        {
          title: "태동 안내",
          text: "평소보다 태동이 줄면 담당 병원에 문의해요.",
        },
      ],
      config: {
        tonePrompt: "먼저 산모가 안심할 수 있는 말로 시작해요.",
        forbiddenTerms: ["참고", "자료"],
      },
    });

    expect(prompt).toContain("먼저 산모가 안심할 수 있는 말로 시작해요.");
    expect(prompt).toContain("산모 주차: 27주차");
    expect(prompt).toContain("의학적 단정(진단·처방)은 하지 말고");
    expect(prompt).toContain("담당 병원에 바로 문의하라고");
    expect(prompt).toContain("사용자에게 참고, 자료 같은 말을 하지 마세요.");
  });

  test("falls back to the default prompt when stored config is invalid", () => {
    expect(normalizeMobileAskPromptConfig({ tonePrompt: "   " })).toEqual(
      DEFAULT_MOBILE_ASK_PROMPT_CONFIG,
    );
    expect(normalizeMobileAskPromptConfig(null)).toEqual(
      DEFAULT_MOBILE_ASK_PROMPT_CONFIG,
    );
  });
});
