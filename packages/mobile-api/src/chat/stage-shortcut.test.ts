import { maybeShortCircuitStaticTurn } from "./stage-shortcut";
import type { PromptContext } from "./chat-repository";

const moodPool = [
  { label: "좋아요", message: "오늘 기분이 좋아요.", tone: "joyful" as const },
  {
    label: "편안해요",
    message: "오늘은 마음이 편안해요.",
    tone: "calm" as const,
  },
  {
    label: "걱정돼요",
    message: "오늘은 조금 걱정돼요.",
    tone: "anxious" as const,
  },
  { label: "피곤해요", message: "몸이 많이 피곤해요.", tone: "tired" as const },
  { label: "슬퍼요", message: "오늘은 마음이 슬퍼요.", tone: "sad" as const },
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

  it("fires mood webhook and shows week_info_opt_in when mood just selected", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "오늘 기분이 좋아요.",
      selectedMood: "오늘 기분이 좋아요.",
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
    }
  });

  it("returns today_question when user answered N to opt-in", () => {
    const r = maybeShortCircuitStaticTurn({
      userText: "아니요, 이따가 확인할래요.",
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
    const payload = r!.workflowMemoryPayload as Record<string, unknown>;
    expect(payload.offeredQuestionIds).toHaveLength(2);
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
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).toBeNull();
  });

  it("offers exhausted choice when closing signal + all questions answered (includes current)", () => {
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
      expect(text.text).toContain("조금 더 이야기");
    }
    const quick = r!.assistantMessage.parts.find(
      (p) => p.type === "quickReplies",
    );
    if (quick?.type === "quickReplies") {
      expect(quick.choices.map((c) => c.id)).toEqual(
        expect.arrayContaining(["free-chat", "end-session"]),
      );
    }
    const payload = r!.workflowMemoryPayload as Record<string, unknown>;
    expect(payload.selectedQuestionIds).toEqual(["q1", "q2", "q3"]);
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
      moodPool,
      weekInfoOptInVariations: optInVariations,
      todayQuestionCandidates: questions,
    });
    expect(r).not.toBeNull();
    expect(r!.workflowMemoryPayload.nextSessionMemory?.stage).toBe("ended");
  });
});
