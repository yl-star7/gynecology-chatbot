import {
  resolveLetterReflectionNextChipMinTurns,
  rewriteLetterReflectionQuickReplies,
} from "./letter-reflection-postprocess";

describe("rewriteLetterReflectionQuickReplies", () => {
  it("hides buttons before the reflection turn threshold", () => {
    const payload = {
      quickReplies: [
        { label: "조금 더 말할래요", message: "하나 더 이야기하고 싶어요." },
        { label: "다른 질문도 볼래요", message: "다음 질문으로 이어갈래요." },
      ],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: ["q1"],
      currentAttachmentQuestionId: "q2",
    });
    expect(out.quickReplies).toBeUndefined();
  });

  it("keeps assistive buttons before the threshold when the option is enabled", () => {
    const payload = { quickReplies: [] };
    const out = rewriteLetterReflectionQuickReplies(
      payload,
      {
        answeredQuestionIds: [],
        currentAttachmentQuestionId: "q1",
      },
      { mode: "assistive" },
    );

    expect(out.quickReplies).toEqual([
      {
        id: "continue",
        label: "조금 더 이야기할래요",
        message: "하나 더 이야기하고 싶어요.",
      },
      {
        id: "reframe",
        label: "다른 쪽으로 물어봐줘요",
        message: "다른 방향으로 물어봐주세요.",
      },
    ]);
  });

  it("uses a stable 3 or 4 turn threshold per question", () => {
    expect(resolveLetterReflectionNextChipMinTurns("q1")).toBe(3);
    expect(resolveLetterReflectionNextChipMinTurns("q2")).toBe(4);
    expect(resolveLetterReflectionNextChipMinTurns("q1")).toBe(3);
  });

  it("appends remaining count to the single next-question button after threshold", () => {
    const payload = {
      quickReplies: [
        { label: "조금 더 말할래요", message: "." },
        { label: "다른 질문도 볼래요", message: "." },
      ],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: "q1",
      currentQuestionTurnCount: resolveLetterReflectionNextChipMinTurns("q1"),
    });
    expect(out.quickReplies).toEqual([
      {
        label: "다른 질문도 볼래요 (2개)",
        message: "다음 질문으로 이어갈래요.",
        id: "next",
      },
    ]);
  });

  it("hides the next-question button until a four-turn question reaches its threshold", () => {
    const payload = {
      quickReplies: [{ label: "다른 질문도 볼래요", message: "." }],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: "q2",
      currentQuestionTurnCount: 3,
    });
    expect(out.quickReplies).toBeUndefined();
  });

  it("moves to free chat when the current question is the last remaining candidate", () => {
    const payload = {
      answer: "마무리 답변",
      quickReplies: [{ label: "다른 질문도 볼래요", message: "." }],
      nextSessionMemory: {
        stage: 2,
        stageName: "choice_conversation",
        currentAttachmentQuestionId: "q2",
      },
    };
    const out = rewriteLetterReflectionQuickReplies(
      payload,
      {
        answeredQuestionIds: ["q1"],
        currentAttachmentQuestionId: "q2",
        currentQuestionTurnCount: resolveLetterReflectionNextChipMinTurns("q2"),
      },
      {
        candidateQuestionIds: ["q1", "q2"],
      },
    );
    expect(out.quickReplies).toBeUndefined();
    expect(out.answer).toBe(
      "오늘의 질문을 모두 답변하셨어요. 이제 자유롭게 얘기해보아요.",
    );
  });

  it("moves to free chat without quick replies when quota is exhausted", () => {
    const payload = {
      answer: "마무리 답변",
      quickReplies: [
        { label: "조금 더 말할래요", message: "." },
        { label: "다른 질문도 볼래요", message: "." },
      ],
      nextSessionMemory: {
        stage: 2,
        stageName: "choice_conversation",
        currentAttachmentQuestionId: "q3",
      },
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: ["q1", "q2"],
      currentAttachmentQuestionId: "q3",
    });
    expect(out.quickReplies).toBeUndefined();
    expect(out.answer).toBe(
      "오늘의 질문을 모두 답변하셨어요. 이제 자유롭게 얘기해보아요.",
    );
    expect(out.scenario).toBe("general");
    expect(out.nextSessionMemory).toMatchObject({
      stage: "free_chat",
      stageName: "free_chat",
      compactSummary: "현재 단계: 자유 대화",
      lastScenario: "general",
      answeredQuestionIds: ["q1", "q2", "q3"],
      currentAttachmentQuestionId: null,
    });
  });

  it("keeps assistive buttons and adds the next button after threshold", () => {
    const payload = { quickReplies: [] };
    const out = rewriteLetterReflectionQuickReplies(
      payload,
      {
        answeredQuestionIds: [],
        currentAttachmentQuestionId: "q1",
        currentQuestionTurnCount: resolveLetterReflectionNextChipMinTurns("q1"),
      },
      { mode: "assistive" },
    );

    expect(out.quickReplies?.map((choice) => choice.label)).toEqual([
      "조금 더 이야기할래요",
      "다른 쪽으로 물어봐줘요",
      "다른 질문도 볼래요 (2개)",
    ]);
  });

  it("adds only the next-question button once the reflection turn threshold is reached", () => {
    const payload = { quickReplies: [] };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: "q1",
      currentQuestionTurnCount: resolveLetterReflectionNextChipMinTurns("q1"),
    });
    expect(out.quickReplies).toHaveLength(1);
    expect(out.quickReplies![0].label).toBe("다른 질문도 볼래요 (2개)");
  });
});
