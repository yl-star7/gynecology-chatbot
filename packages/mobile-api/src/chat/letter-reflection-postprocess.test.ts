import {
  QUESTION_WRAP_UP_MESSAGE,
  resolveLetterReflectionCurrentTurnCount,
  resolveLetterReflectionNextChipMinTurns,
  rewriteLetterReflectionQuickReplies,
  syncLetterReflectionPayloadToMessageParts,
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

  it("uses a stable two-turn threshold per question", () => {
    expect(resolveLetterReflectionNextChipMinTurns("q1")).toBe(2);
    expect(resolveLetterReflectionNextChipMinTurns("q2")).toBe(2);
    expect(resolveLetterReflectionNextChipMinTurns("q1")).toBe(2);
  });

  it("resolves the current turn count from persisted memory first", () => {
    expect(
      resolveLetterReflectionCurrentTurnCount({
        priorQuestionId: "q1",
        priorTurnCount: 2,
        nextQuestionId: "q1",
        recentMessages: [{ role: "user", text: "이전 답변" }],
      }),
    ).toBe(3);
  });

  it("falls back to recent question messages when memory has no turn count", () => {
    expect(
      resolveLetterReflectionCurrentTurnCount({
        priorQuestionId: "q1",
        priorTurnCount: 0,
        nextQuestionId: "q1",
        recentMessages: [
          {
            role: "assistant",
            text: "이 질문에 대해 편안하게 답해주세요.",
          },
          { role: "user", text: "첫 답변" },
          { role: "assistant", text: "좋아요." },
          { role: "user", text: "두 번째 답변" },
        ],
      }),
    ).toBe(2);
  });

  it("appends remaining count to the single next-question button after threshold", () => {
    const payload = {
      answer: "그 마음이 따뜻하게 전해질 것 같아요. 또 어떤 감정이 드시나요?",
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
    expect(out.answer).toBe(
      `그 마음이 따뜻하게 전해질 것 같아요.\n\n${QUESTION_WRAP_UP_MESSAGE}`,
    );
  });

  it("hides the next-question button until the second reflection turn", () => {
    const payload = {
      quickReplies: [{ label: "다른 질문도 볼래요", message: "." }],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: "q2",
      currentQuestionTurnCount: 1,
    });
    expect(out.quickReplies).toBeUndefined();
  });

  it("preserves the active question memory when the model omits session memory", () => {
    const payload = {
      answer: "천천히 해볼게요.",
      quickReplies: [{ label: "다른 질문도 볼래요", message: "." }],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: ["q1"],
      currentAttachmentQuestionId: "q2",
      currentQuestionTurnCount: 1,
    });

    expect(out.nextSessionMemory).toMatchObject({
      workflowVersion: 2,
      stage: 2,
      stageName: "choice_conversation",
      compactSummary: "현재 단계: 질문 답변 중",
      lastScenario: "letter_reflection",
      answeredQuestionIds: ["q1"],
      currentAttachmentQuestionId: "q2",
      currentQuestionTurnCount: 1,
    });
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

describe("syncLetterReflectionPayloadToMessageParts", () => {
  it("syncs the rewritten answer and quick replies into assistant parts", () => {
    const assistantMessage = {
      parts: [
        {
          type: "text",
          id: "text-1",
          text: "또 어떤 감정이 드시나요?",
        },
        {
          type: "quickReplies",
          id: "quick-1",
          choices: [],
        },
      ],
    };

    syncLetterReflectionPayloadToMessageParts(assistantMessage, {
      answer: `충분히 잘 담아두셨어요.\n\n${QUESTION_WRAP_UP_MESSAGE}`,
      quickReplies: [
        {
          id: "next",
          label: "다른 질문도 볼래요 (2개)",
          message: "다음 질문으로 이어갈래요.",
        },
      ],
    });

    expect(assistantMessage.parts[0]).toEqual({
      type: "text",
      id: "text-1",
      text: `충분히 잘 담아두셨어요.\n\n${QUESTION_WRAP_UP_MESSAGE}`,
    });
    expect(assistantMessage.parts[1]).toMatchObject({
      type: "quickReplies",
      choices: [
        {
          id: "next",
          label: "다른 질문도 볼래요 (2개)",
          message: "다음 질문으로 이어갈래요.",
        },
      ],
    });
  });

  it("removes stale quick replies when the rewritten payload hides them", () => {
    const assistantMessage = {
      parts: [
        { type: "text", id: "text-1", text: "계속 이야기해볼까요?" },
        {
          type: "quickReplies",
          id: "quick-1",
          choices: [{ label: "다음", message: "다음" }],
        },
      ],
    };

    syncLetterReflectionPayloadToMessageParts(assistantMessage, {
      answer: "그 마음을 같이 기억해둘게요.",
    });

    expect(assistantMessage.parts).toEqual([
      {
        type: "text",
        id: "text-1",
        text: "그 마음을 같이 기억해둘게요.",
      },
    ]);
  });
});
