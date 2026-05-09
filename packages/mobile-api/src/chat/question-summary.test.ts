import {
  buildFallbackQuestionAnswerSummary,
  buildQuestionSummaryTitle,
  buildQuestionSummaryRecord,
  buildSummaryText,
  buildTitle,
  QUESTION_SUMMARY_PENDING_COPY,
  isQuestionAnswerText,
  isQuestionSummaryPendingText,
  isUsableQuestionAnswerSummary,
  resolveQuestionSummaryQuestionId,
  shouldSaveQuestionSummary,
} from "./question-summary";

describe("buildSummaryText", () => {
  it("prefers a usable generated compactSummary without '현재 단계:' prefix", () => {
    expect(
      buildSummaryText({
        compactSummary:
          "현재 단계: 아기에게 따뜻한 마음을 전하고 싶다는 바람을 남겼어요. 편지를 쓰듯 마음을 건네며 오늘의 애정을 기록했어요.",
        userAnswer: "답변은 길어도 두번째 순위",
      }),
    ).toBe(
      "아기에게 따뜻한 마음을 전하고 싶다는 바람을 남겼어요. 편지를 쓰듯 마음을 건네며 오늘의 애정을 기록했어요.",
    );
  });

  it("keeps a pending placeholder when compactSummary is too short", () => {
    expect(
      buildSummaryText({
        compactSummary: "짧음",
        userAnswer:
          "사용자 답변이 길게 들어온다면 이걸 요약으로 사용합니다 한참 적었어요",
      }),
    ).toBe(QUESTION_SUMMARY_PENDING_COPY);
  });

  it("keeps a pending placeholder when compactSummary is only workflow state", () => {
    const summary = buildSummaryText({
      compactSummary:
        "현재 단계: 질문 답변 대기 (a5d93e8b-02e8-428d-8ea8-c5ef9569691c)",
      userAnswer: "오늘은 아기에게 고맙다고 말하고 싶어요.",
    });

    expect(summary).toBe(QUESTION_SUMMARY_PENDING_COPY);
    expect(summary).not.toContain("질문 답변 대기");
  });

  it("keeps a pending placeholder when compactSummary only says answer is in progress", () => {
    const summary = buildSummaryText({
      compactSummary: "현재 단계: 질문 답변 중",
      userAnswer:
        "갑자기 마음이 아플 때는 숨을 고르고 괜찮다고 말해주고 싶어요.",
    });

    expect(summary).toBe(QUESTION_SUMMARY_PENDING_COPY);
    expect(summary).not.toContain("질문 답변 중");
  });

  it("does not persist a raw short answer as the final summary", () => {
    const summary = buildSummaryText({
      compactSummary: "나도 잘 모르겠네",
      questionText: "아기에게 사랑을 키우는 방법을 알려주세요.",
      userAnswer: "나도 잘 모르겠네",
    });

    expect(summary).not.toBe("나도 잘 모르겠네");
    expect(summary).toBe(QUESTION_SUMMARY_PENDING_COPY);
  });

  it("truncates to the answer summary character budget", () => {
    const summary = buildSummaryText({
      compactSummary: "현재 단계: " + "긴내용".repeat(100),
      userAnswer: "x",
    });
    expect(summary.length).toBeLessThanOrEqual(280);
  });
});

describe("isUsableQuestionAnswerSummary", () => {
  it("distinguishes raw answers from generated summaries", () => {
    expect(
      isUsableQuestionAnswerSummary({
        summary: "줄때",
        answer: "줄때",
      }),
    ).toBe(false);
    expect(
      isUsableQuestionAnswerSummary({
        summary:
          "사랑을 받을 때보다 줄 때 더 행복하다고 느꼈어요. 아기에게 마음을 건네고 돌보는 순간에서 기쁨을 발견한 기록이에요.",
        answer: "줄때",
      }),
    ).toBe(true);
  });
});

describe("isQuestionSummaryPendingText", () => {
  it("detects workflow lifecycle labels that are not answer summaries", () => {
    expect(
      isQuestionSummaryPendingText(
        "현재 단계: 질문 답변 대기 (a5d93e8b-02e8-428d-8ea8-c5ef9569691c)",
      ),
    ).toBe(true);
    expect(isQuestionSummaryPendingText("오늘 자정에 요약이 준비됩니다.")).toBe(
      true,
    );
    expect(
      isQuestionSummaryPendingText("편지 후속 질문. 아기에게 따뜻한 마음 전함"),
    ).toBe(false);
  });
});

describe("isQuestionAnswerText", () => {
  it("accepts a real free-text answer", () => {
    expect(
      isQuestionAnswerText({
        userAnswer: "갑자기 마음이 아플 때는 스스로 괜찮다고 말해주고 싶어요.",
      }),
    ).toBe(true);
  });

  it("rejects control replies and selected question text", () => {
    expect(
      isQuestionAnswerText({ userAnswer: "다음 질문으로 이어갈래요." }),
    ).toBe(false);
    expect(
      isQuestionAnswerText({
        userAnswer: "기대감 하나 더 얘기하고 싶어요.",
      }),
    ).toBe(false);
    expect(
      isQuestionAnswerText({ userAnswer: "자유롭게 대화하고 싶어요." }),
    ).toBe(false);
    expect(
      isQuestionAnswerText({
        userAnswer: "오늘 아기에게 들려주고 싶은 말은?",
        questionText: "오늘 아기에게 들려주고 싶은 말은?",
      }),
    ).toBe(false);
  });
});

describe("resolveQuestionSummaryQuestionId", () => {
  it("uses the current question when an answer turn has no selectedQuestionId", () => {
    expect(
      resolveQuestionSummaryQuestionId({
        selectedQuestionId: null,
        currentAttachmentQuestionId: "q1",
        nextAttachmentQuestionId: "q1",
      }),
    ).toBe("q1");
  });

  it("uses selectedQuestionId on the question selection turn", () => {
    expect(
      resolveQuestionSummaryQuestionId({
        selectedQuestionId: "q2",
        currentAttachmentQuestionId: null,
        nextAttachmentQuestionId: "q2",
      }),
    ).toBe("q2");
  });
});

describe("buildTitle", () => {
  it("uses question text up to 40 chars", () => {
    expect(
      buildTitle("오늘 아기에게 들려주고 싶은 말은 무엇인가요?"),
    ).toContain("오늘 아기에게");
  });

  it("falls back when null", () => {
    expect(buildTitle(null)).toBe("오늘의 질문 기록");
  });

  it("creates a concise title for body preparation questions", () => {
    expect(
      buildQuestionSummaryTitle(
        "그동안 우리 몸은 아기를 위해 태반을 만들고,초유를 준비하고 있대요. 엄마가 될 준비를 하고 있는 몸을 보며 어떤 마음이 드나요?",
      ),
    ).toBe("몸의 준비를 바라본 마음");
  });
});

describe("buildFallbackQuestionAnswerSummary", () => {
  it("expands a short repeated answer into a contextual summary", () => {
    const summary = buildFallbackQuestionAnswerSummary({
      questionText:
        "그동안 우리 몸은 아기를 위해 태반을 만들고,초유를 준비하고 있대요. 엄마가 될 준비를 하고 있는 몸을 보며 어떤 마음이 드나요?",
      userAnswer: "고생하는구나 고생하는구나",
    });

    expect(summary).toBe(
      "태반과 초유를 준비해 온 몸을 보며, 몸이 참 고생하고 있다는 마음을 표현했어요. 엄마가 될 준비를 해내는 몸을 다정하게 바라본 기록이에요.",
    );
  });

  it("uses contextual summaries for short answers", () => {
    expect(
      buildFallbackQuestionAnswerSummary({
        questionText: "아기가 태어나면 같이 하고싶은 운동이 있나요?",
        userAnswer: "수영",
      }),
    ).toBe(
      "아기가 태어나면 함께 수영을 해보고 싶다는 바람을 남겼어요. 물속에서 같이 움직이는 시간을 기대한 기록이에요.",
    );
  });
});

describe("shouldSaveQuestionSummary", () => {
  it("returns true at stage=2 with new questionId", () => {
    expect(
      shouldSaveQuestionSummary({
        workflowStage: 2,
        selectedQuestionId: "q1",
        alreadyPersistedQuestionIds: new Set(),
      }),
    ).toBe(true);
  });

  it("returns false at other stages", () => {
    expect(
      shouldSaveQuestionSummary({
        workflowStage: 0,
        selectedQuestionId: "q1",
        alreadyPersistedQuestionIds: new Set(),
      }),
    ).toBe(false);
  });

  it("returns false when questionId already persisted today", () => {
    expect(
      shouldSaveQuestionSummary({
        workflowStage: 2,
        selectedQuestionId: "q1",
        alreadyPersistedQuestionIds: new Set(["q1"]),
      }),
    ).toBe(false);
  });

  it("returns false when no questionId", () => {
    expect(
      shouldSaveQuestionSummary({
        workflowStage: 2,
        selectedQuestionId: null,
        alreadyPersistedQuestionIds: new Set(),
      }),
    ).toBe(false);
  });

  it("returns false while the user has only selected a question and has not answered it", () => {
    expect(
      shouldSaveQuestionSummary({
        workflowStage: 2,
        selectedQuestionId: "q1",
        alreadyPersistedQuestionIds: new Set(),
        compactSummary: "현재 단계: 질문 답변 대기 (q1)",
      }),
    ).toBe(false);
  });

  it("returns true when the user answered while compactSummary only says the answer is in progress", () => {
    expect(
      shouldSaveQuestionSummary({
        workflowStage: 2,
        selectedQuestionId: "q1",
        alreadyPersistedQuestionIds: new Set(),
        compactSummary: "현재 단계: 질문 답변 중",
      }),
    ).toBe(true);
  });
});

describe("isQuestionAnswerText", () => {
  it("rejects navigation quick replies", () => {
    expect(isQuestionAnswerText({ userAnswer: "더 확인하고 싶어요" })).toBe(
      false,
    );
    expect(
      isQuestionAnswerText({ userAnswer: "오늘 실천할 일도 볼게요." }),
    ).toBe(false);
  });

  it("rejects greeting-only messages", () => {
    expect(isQuestionAnswerText({ userAnswer: "안녕" })).toBe(false);
  });
});

describe("buildQuestionSummaryRecord", () => {
  it("builds a complete record with payload", () => {
    const rec = buildQuestionSummaryRecord({
      userId: "u1",
      sessionId: "s1",
      dateKey: "2026-04-21",
      questionId: "q1",
      questionText: "오늘 아기에게 들려주고 싶은 말은?",
      userAnswer: "엄마는 지금 네가 너무 소중해",
      assistantAnswer: "따뜻한 마음을 잘 전하셨어요.",
      compactSummary: "현재 단계: 편지 후속 질문",
      emotionTone: "calm",
      moodId: "joyful",
      moodLabel: "좋아요",
    });
    expect(rec.entryType).toBe("question_summary");
    expect(rec.userId).toBe("u1");
    expect(rec.payload.questionId).toBe("q1");
    expect(rec.payload.answer).toContain("엄마는");
    expect(rec.payload.aiResponse).toContain("따뜻한");
    expect(rec.payload.source).toBe("attachment_question_followup");
  });
});
