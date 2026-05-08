import {
  maybeShortCircuitStaticTurn,
  mergeQuestionProgressWithMemory,
} from "./stage-shortcut";
import type { PromptContext } from "./chat-repository";
import type { ChatFlowConfig } from "./chat-flow-config";

const moodPool = [
  {
    label: "좋아요",
    message: "오늘은 좋은 기분이에요.",
    tone: "joyful" as const,
  },
  {
    label: "우울해요",
    message: "오늘은 우울한 기분이에요.",
    tone: "sad" as const,
  },
  { label: "슬퍼요", message: "오늘은 슬픈 기분이에요.", tone: "sad" as const },
  {
    label: "화나요",
    message: "오늘은 화나는 기분이에요.",
    tone: "anxious" as const,
  },
  {
    label: "직접 말하고 싶어요",
    message: "직접 말하고 싶어요.",
    tone: "calm" as const,
  },
  {
    label: "편안해요",
    message: "오늘은 마음이 편안해요.",
    tone: "calm" as const,
  },
  {
    label: "피곤해요",
    message: "몸이 많이 피곤해요.",
    tone: "tired" as const,
  },
];

const optInVariations = [
  "오늘 주차의 산모/태아 정보가 궁금하세요?",
  "이번 주 우리 아가 소식 볼래요?",
];

const questions = [
  { id: "q1", text: "오늘 아기에게 들려주고 싶은 말은?" },
  { id: "q2", text: "아기가 언제 엄마 마음을 느낄 것 같나요?" },
  { id: "q3", text: "오늘 기억에 남는 순간은?" },
];

function flowConfigWithMoodPrompts(
  moodPrompts = moodPool,
  directInputAcknowledgementText = "오늘의 기분 나눠줘서 고마워요. 잘 기억해서 차근차근 더 이야기 해볼게요.",
): ChatFlowConfig {
  return {
    dataSources: [],
    moodIntake: {
      promptText: "오늘은 마음이 어떠세요?",
      directInputAcknowledgementText,
      moodPrompts,
      acknowledgementsByTone: {},
    },
    weekInfoOptIn: {
      answerVariations: optInVariations,
      quickReplies: {
        yes: {
          id: "week-info-yes",
          label: "네",
          message: "네, 오늘 주차 정보 볼래요.",
        },
        no: {
          id: "week-info-no",
          label: "나중에요",
          message: "나중에 볼게요.",
        },
      },
    },
    todayQuestion: {
      promptText: "아래 질문 중 하나를 골라 이어가요.",
      blockedText:
        "얘기해주셔서 감사해요. 😊\n오늘의 태교 질문에 먼저 답해주시면, 이후에는 편안한 자유 대화로 이어갈 수 있어요.",
      deferredWeekInfoText:
        "사전은 나중에 봐도 좋아요. 아래 질문 중 하나를 골라 이어가요.",
      compactSummaryTemplate:
        "현재 단계: 모아애착 질문 ({{answeredCount}}/{{quota}} 답변 완료)",
    },
    questionSelected: { answerTemplate: "{{questionText}}" },
    activeQuestionRequired: { answerTemplate: "{{questionText}}" },
    questionAnswer: { reflectionLoop: {} },
    exhaustedChoice: { answerText: "오늘의 질문을 모두 답변하셨어요." },
    freeChatIntro: {
      answerText: "편하게 이야기 이어갈게요.",
      quickReplies: [],
    },
    ended: { answerText: "오늘 이야기해줘서 고마워요." },
  } as unknown as ChatFlowConfig;
}

const longQuestions = [
  {
    id: "q1",
    text: "오늘 하루를 천천히 돌아봐요. 아기에게 가장 먼저 들려주고 싶은 말은?",
  },
  {
    id: "q2",
    text: "몸이 힘들었던 순간도 있었나요? 그때 아기에게 어떤 마음이 전해졌을까요?",
  },
];

function baseContext(overrides?: Partial<PromptContext>): PromptContext {
  return {
    sessionMemory: null,
    profileMemory: null,
    week: { baby_summary: null, mother_summary: null },
    dayContent: null,
    questions: [],
    checklist: [],
    tonePreference: null,
    ...(overrides ?? {}),
  } as PromptContext;
}

describe("maybeShortCircuitStaticTurn", () => {
  const originalQuestionChipSummaryEnabled =
    process.env.QUESTION_CHIP_SUMMARY_ENABLED;

  afterEach(() => {
    if (originalQuestionChipSummaryEnabled === undefined) {
      delete process.env.QUESTION_CHIP_SUMMARY_ENABLED;
    } else {
      process.env.QUESTION_CHIP_SUMMARY_ENABLED =
        originalQuestionChipSummaryEnabled;
    }
  });

  it("returns mood intake when no stage and no mood", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext(),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.scenario).toBe("emotion_checkin");
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(0);
    const quick = r!.assistantMessage.parts.find(
      (p) => p.type === "quickReplies",
    );
    expect(quick?.type).toBe("quickReplies");
    if (quick?.type === "quickReplies") {
      expect(quick.choices.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("fires mood webhook and shows week_info_opt_in when exact mood option was selected", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "오늘은 좋은 기분이에요.",
      selectedMood: "오늘은 좋은 기분이에요.",
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 0,
          stageName: "mood_intake",
          compactSummary: "현재 단계: 감정 확인",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
      rngSeed: 0,
    });
    expect(r).not.toBeNull();
    expect(r!.sideEffects?.fireMoodWebhook?.moodLabel).toBe("좋아요");
    expect(r!.workflowMemoryPayload.scenario).toBe("baby_info_offer");
    expect(
      r!.workflowMemoryPayload.nextSessionMemory?.compactSummary,
    ).toContain("태아 발달 확인 제안");
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    if (text?.type === "text") {
      expect(text.text).toContain(optInVariations[0]);
      expect(text.text).toContain("그 밝은 기분");
    }
    expect(
      r!.assistantMessage.parts.some((part) => part.type === "quickReplies"),
    ).toBe(true);
  });

  it("varies the mood acknowledgement by selected mood tone", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "몸이 많이 피곤해요.",
      selectedMood: "몸이 많이 피곤해요.",
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 0,
          stageName: "mood_intake",
          compactSummary: "현재 단계: 감정 확인",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
      rngSeed: 0,
    });

    expect(r).not.toBeNull();
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toContain("피곤한 마음");
      expect(text.text).not.toContain("그 마음 기억해둘게요");
    }
  });

  it("uses an admin-managed mood acknowledgement pool when provided", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "오늘은 좋은 기분이에요.",
      selectedMood: "오늘은 좋은 기분이에요.",
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 0,
          stageName: "mood_intake",
          compactSummary: "현재 단계: 감정 확인",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      moodAcknowledgementPool: [
        "관리자가 정한 첫 문장",
        "관리자가 정한 둘째 문장",
      ],
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
      rngSeed: 0,
    });

    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toContain("관리자가 정한 둘째 문장");
    }
  });

  it("falls through when free text resembles a mood but was not an exact option tap", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "오늘은 몸이 많이 피곤해요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 0,
          stageName: "mood_intake",
          compactSummary: "현재 단계: 감정 확인",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).toBeNull();
  });

  it("uses the configured direct-input acknowledgement before offering week info", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "막연히 복잡해요.",
      selectedMood: "막연히 복잡해요.",
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 0,
          stageName: "mood_intake",
          compactSummary: "현재 단계: 감정 확인",
        } as PromptContext["sessionMemory"],
      }),
      moodPool: [
        {
          label: "직접 입력",
          message: "막연히 복잡해요.",
          tone: "sad" as const,
        },
        ...moodPool,
      ],
      flowConfig: flowConfigWithMoodPrompts(
        moodPool,
        "관리자가 설정한 직접 입력 응답이에요.",
      ),
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
      rngSeed: 0,
    });

    expect(r).not.toBeNull();
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toContain("관리자가 설정한 직접 입력 응답이에요.");
      expect(text.text).toContain(optInVariations[0]);
    }
  });

  it("shows today questions when user defers week info and questions remain", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "나중에 볼게요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 0,
          stageName: "week_info_opt_in",
          compactSummary: "현재 단계: 태아 발달 확인 제안",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.scenario).toBe("attachment_question");
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(1);
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toContain("사전은 나중에 봐도 좋아요.");
    }
    const quick = r!.assistantMessage.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quick?.type).toBe("quickReplies");
    if (quick?.type === "quickReplies") {
      expect(quick.choices).toHaveLength(3);
    }
  });

  it("keeps showing today questions when user defers today questions after week info", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "나중에 볼게요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 1,
          stageName: "today_question",
          compactSummary: "현재 단계: 주차 정보 안내 완료",
          lastScenario: "baby_info",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.scenario).toBe("attachment_question");
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(1);
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toContain("얘기해주셔서 감사해요. 😊");
    }
    const quick = r!.assistantMessage.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quick?.type).toBe("quickReplies");
  });

  it("moves to free chat when week info is deferred after all questions are answered", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "나중에 볼게요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 0,
          stageName: "week_info_opt_in",
          compactSummary: "현재 단계: 태아 발달 확인 제안",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
      progress: {
        answeredQuestionIds: ["q1", "q2", "q3"],
        currentAttachmentQuestionId: null,
      },
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe("free_chat");
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toBe(
        "오늘의 질문을 모두 답변하셨어요. 이제 자유롭게 얘기해보아요.",
      );
    }
    expect(
      r!.assistantMessage.parts.some((part) => part.type === "quickReplies"),
    ).toBe(false);
  });

  it("keeps the active question session when user defers", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "이따가 함께 질문에 답해봐요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 대기 (q1)",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
      progress: {
        answeredQuestionIds: [],
        currentAttachmentQuestionId: "q1",
      },
    });

    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(2);
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stageName).toBe(
      "choice_conversation",
    );
    expect(
      r!.workflowMemoryPayload.nextSessionMemory?.answeredQuestionIds,
    ).toEqual([]);
    expect(r!.workflowMemoryPayload.selectedQuestionIds).toEqual([]);
    expect(
      r!.workflowMemoryPayload.nextSessionMemory?.currentAttachmentQuestionId,
    ).toBe("q1");
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toContain("얘기해주셔서 감사해요. 😊");
      expect(text.text).toContain("오늘의 태교 질문에 먼저 답해주시면");
      expect(text.text).toContain("오늘 아기에게 들려주고 싶은 말은?");
    }
  });

  it("returns to today questions when a stale free chat memory still has unanswered questions", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "혹시 커피 마셔도 되나요?",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: "free_chat",
          stageName: "today_question_deferred",
          compactSummary: "현재 단계: 오늘의 질문 나중에 진행",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });

    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(1);
    expect(r!.workflowMemoryPayload.scenario).toBe("attachment_question");
  });

  it("uses full question text for question chips by default", () => {
    delete process.env.QUESTION_CHIP_SUMMARY_ENABLED;

    const r = maybeShortCircuitStaticTurn({
      userText: "오늘 질문을 하나 골라볼게요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 1,
          stageName: "today_question",
          compactSummary: "현재 단계: 오늘의 질문 준비",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: longQuestions,
    });

    const quick = r!.assistantMessage.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quick?.type).toBe("quickReplies");
    if (quick?.type === "quickReplies") {
      expect(quick.choices[0].label).toBe(longQuestions[0].text);
    }
  });

  it("summarizes question chips only when the feature flag is enabled", () => {
    process.env.QUESTION_CHIP_SUMMARY_ENABLED = "true";

    const r = maybeShortCircuitStaticTurn({
      userText: "오늘 질문을 하나 골라볼게요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 1,
          stageName: "today_question",
          compactSummary: "현재 단계: 오늘의 질문 준비",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: longQuestions,
    });

    const quick = r!.assistantMessage.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quick?.type).toBe("quickReplies");
    if (quick?.type === "quickReplies") {
      expect(quick.choices[0].label).toBe(
        "아기에게 가장 먼저 들려주고 싶은 말은?",
      );
    }
  });

  it("returns today_question when user chooses the today question path", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "오늘 질문을 하나 골라볼게요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 0,
          stageName: "week_info_opt_in",
          compactSummary: "현재 단계: 주차 정보 안내 완료",
          lastScenario: "baby_info",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.scenario).toBe("attachment_question");
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toBe("아래 질문 중 하나를 골라 이어가요.");
    }
    const payload = r!.workflowMemoryPayload as Record<string, unknown>;
    expect(payload.offeredQuestionIds).toHaveLength(3);
  });

  it("falls through (null) when stage=0 Y path — needs LLM", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "네, 오늘 주차 정보 볼래요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 0,
          stageName: "week_info_opt_in",
          compactSummary: "현재 단계: 태아 발달 확인 제안",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).toBeNull();
  });

  it("returns today_question at stage=1 when question not yet selected", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 1,
          stageName: "today_question",
          compactSummary: "현재 단계: 오늘의 질문 준비",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.scenario).toBe("attachment_question");
  });

  it("requires question selection at stage=1 when the user writes a free emotion message", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "우울해요",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 1,
          stageName: "today_question",
          compactSummary: "현재 단계: 오늘의 질문 준비",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });

    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(1);
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toContain("얘기해주셔서 감사해요. 😊");
      expect(text.text).toContain("오늘의 태교 질문에 먼저 답해주시면");
    }
  });

  it("formats the selected attachment question as one bold quoted line", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "“오늘 아기에게 들려주고 싶은 말은?”",
      selectedMood: null,
      selectedQuestionId: "q1",
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 1,
          stageName: "today_question",
          compactSummary: "현재 단계: 오늘의 질문 준비",
        } as PromptContext["sessionMemory"],
      }),
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: [
        { id: "q1", text: "“오늘 아기에게 들려주고 싶은 말은?”" },
      ],
    });

    const textPart = r!.assistantMessage.parts.find(
      (part) => part.type === "text",
    );
    expect(textPart?.type).toBe("text");
    if (textPart?.type === "text") {
      expect(textPart.text.split("\n")[0]).toBe(
        '**"오늘 아기에게 들려주고 싶은 말은?"**',
      );
      expect(textPart.text).not.toContain('""오늘 아기에게');
      expect(textPart.text).not.toContain('**"“');
    }
    expect(r!.workflowMemoryPayload.nextSessionMemory).toMatchObject({
      currentAttachmentQuestionId: "q1",
      currentQuestionTurnCount: 0,
      stage: 2,
    });
  });

  it("falls through at stage=2 with selectedQuestionId (LLM needed)", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "아기에게 따뜻한 마음을 전했어요.",
      selectedMood: null,
      selectedQuestionId: "q1",
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 선택 완료",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: ["q1", "q2", "q3"],
        currentAttachmentQuestionId: null,
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).toBeNull();
  });

  it("requires the current question when user tries to stop before answering all questions", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "오늘은 여기까지 할래요",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 종료",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        // SQL에서 조회: q1,q2 이미 answered, q3 은 sent 상태(현재 대화 중)
        answeredQuestionIds: ["q1", "q2"],
        currentAttachmentQuestionId: "q3",
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    if (text?.type === "text") {
      expect(text.text).toContain("얘기해주셔서 감사해요. 😊");
      expect(text.text).toContain("오늘의 태교 질문에 먼저 답해주시면");
    }
    expect(
      r!.assistantMessage.parts.some((part) => part.type === "quickReplies"),
    ).toBe(false);
    const payload = r!.workflowMemoryPayload as Record<string, unknown>;
    expect(payload.selectedQuestionIds).toEqual(["q1", "q2"]);
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(2);
    expect(
      r!.workflowMemoryPayload.nextSessionMemory?.currentAttachmentQuestionId,
    ).toBe("q3");
  });

  it("moves to free chat when next-question signal exhausts all answered questions", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "다음 질문으로 넘어가기.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 종료",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: ["q1", "q2"],
        currentAttachmentQuestionId: "q3",
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });

    expect(r).not.toBeNull();
    const payload = r!.workflowMemoryPayload as Record<string, unknown>;
    expect(payload.selectedQuestionIds).toEqual(["q1", "q2", "q3"]);
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe("free_chat");
  });

  it("uses session memory answered questions when event progress has not caught up", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "다음 질문으로 이어갈래요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 종료",
          answeredQuestionIds: ["q1"],
          currentAttachmentQuestionId: "q2",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: [],
        currentAttachmentQuestionId: null,
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions.slice(0, 2),
    });

    expect(r).not.toBeNull();
    const payload = r!.workflowMemoryPayload as Record<string, unknown>;
    expect(payload.selectedQuestionIds).toEqual(["q1", "q2"]);
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe("free_chat");
  });

  it("prefers the current question from session memory when progress has a stale sent event", () => {
    expect(
      mergeQuestionProgressWithMemory(
        {
          answeredQuestionIds: [],
          currentAttachmentQuestionId: "q1",
        },
        {
          answeredQuestionIds: ["q1"],
          currentAttachmentQuestionId: "q2",
        } as PromptContext["sessionMemory"],
      ),
    ).toEqual({
      answeredQuestionIds: ["q1"],
      currentAttachmentQuestionId: "q2",
    });
  });

  it("excludes the memory current question after a next-question signal when SQL progress has no current question", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "다음 질문으로 이어갈래요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 중",
          currentAttachmentQuestionId: "q1",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: [],
        currentAttachmentQuestionId: null,
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });

    expect(r).not.toBeNull();
    const payload = r!.workflowMemoryPayload as Record<string, unknown>;
    expect(payload.selectedQuestionIds).toEqual(["q1"]);
    const quickReplies = r!.assistantMessage.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quickReplies?.type).toBe("quickReplies");
    if (quickReplies?.type === "quickReplies") {
      expect(quickReplies.choices.map((choice) => choice.id)).toEqual([
        "q2",
        "q3",
      ]);
    }
  });

  it("keeps stage=2 on short gratitude (not explicit closing)", () => {
    // "고마워요" 같은 감사 표현은 closing 아님 — LLM 경로로 떨어져야 함
    const r = maybeShortCircuitStaticTurn({
      userText: "고마워요",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 중",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: [],
        currentAttachmentQuestionId: "q1",
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    // stage=2 유지: shortcut 이 가로채지 않고 null 반환 → LLM empathy 응답 예상
    expect(r).toBeNull();
  });

  it("keeps the current question active on contextual continuation", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "기대감 하나 더 얘기하고 싶어요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 중",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: [],
        currentAttachmentQuestionId: "q1",
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).toBeNull();
  });

  it("does not move to free chat without answering the current question when user defers it", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "음... 얘기하고 싶지 않아요. 나중에 하고 싶어요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 중",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: ["q1"],
        currentAttachmentQuestionId: "q2",
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(2);
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stageName).toBe(
      "choice_conversation",
    );
    expect(
      r!.workflowMemoryPayload.nextSessionMemory?.answeredQuestionIds,
    ).toEqual(["q1"]);
    expect(
      r!.workflowMemoryPayload.nextSessionMemory?.currentAttachmentQuestionId,
    ).toBe("q2");
  });

  it("requires a question selection when the user types freely on the question list", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "그냥 커피 마셔도 되는지 궁금해요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 1,
          stageName: "today_question",
          compactSummary: "현재 단계: 모아애착 질문",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: [],
        currentAttachmentQuestionId: null,
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });

    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(1);
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toContain("얘기해주셔서 감사해요. 😊");
      expect(text.text).toContain("오늘의 태교 질문에 먼저 답해주시면");
    }
  });

  it("shows the blocked question-list message when free text tries to escape required questions", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "자유롭게 다른 이야기를 먼저 하고 싶어요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 1,
          stageName: "today_question",
          compactSummary: "현재 단계: 모아애착 질문",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: [],
        currentAttachmentQuestionId: null,
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });

    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(1);
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stageName).toBe(
      "today_question",
    );
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toBe(
        "얘기해주셔서 감사해요. 😊\n오늘의 태교 질문에 먼저 답해주시면, 이후에는 편안한 자유 대화로 이어갈 수 있어요.",
      );
    }
    const quick = r!.assistantMessage.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quick?.type).toBe("quickReplies");
    if (quick?.type === "quickReplies") {
      expect(quick.choices.map((choice) => choice.id)).toEqual([
        "q1",
        "q2",
        "q3",
      ]);
    }
  });

  it("shows the active-question message when free chat is requested before the current answer", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "자유롭게 대화하고 싶어요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 중",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: ["q1"],
        currentAttachmentQuestionId: "q2",
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });

    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe(2);
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stageName).toBe(
      "choice_conversation",
    );
    const text = r!.assistantMessage.parts.find((p) => p.type === "text");
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(text.text).toContain(
        "얘기해주셔서 감사해요. 😊\n오늘의 태교 질문에 먼저 답해주시면, 이후에는 편안한 자유 대화로 이어갈 수 있어요.",
      );
      expect(text.text).toContain("아기가 언제 엄마 마음을 느낄 것 같나요?");
    }
    expect(
      r!.assistantMessage.parts.some((part) => part.type === "quickReplies"),
    ).toBe(false);
  });

  it("returns to stage=1 on explicit '다음 질문으로' signal", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "다음 질문으로 이어갈래요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 중",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: [],
        currentAttachmentQuestionId: "q1",
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.scenario).toBe("attachment_question");
    const next = r!.workflowMemoryPayload.nextSessionMemory as Record<
      string,
      unknown
    >;
    expect(next.stage).toBe(1);
    expect(next.answeredQuestionIds).toEqual(["q1"]);
    expect(next.currentAttachmentQuestionId).toBeNull();
  });

  it("transitions to free_chat stage when user selects 자유대화", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "자유롭게 대화하고 싶어요.",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: 2,
          stageName: "exhausted_choice",
          compactSummary: "현재 단계: 자유대화/종료 선택",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: ["q1", "q2", "q3"],
        currentAttachmentQuestionId: null,
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe("free_chat");
  });

  it("ends session on closing signal without LLM", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "오늘은 여기까지 할게요",
      selectedMood: null,
      selectedQuestionId: null,
      currentWeek: 27,
      promptContext: baseContext({
        sessionMemory: {
          stage: "free_chat",
          stageName: "free_chat",
          compactSummary: "현재 단계: 자유 대화",
        } as PromptContext["sessionMemory"],
      }),
      progress: {
        answeredQuestionIds: ["q1", "q2", "q3"],
        currentAttachmentQuestionId: null,
      },
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe("ended");
  });
});
