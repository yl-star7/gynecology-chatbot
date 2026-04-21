/**
 * Stage 기반 short-circuit — LLM 호출 없이 static 응답으로 즉시 반환.
 *
 * 입력: 현재 stage, 사용자 입력 텍스트, 선택된 mood/question, 주차, session memory
 * 출력: static 턴이면 { assistantMessage, workflowMemoryPayload }, 아니면 null
 *
 * 사용 위치: apps/web/app/api/mobile/chat/route.ts 에서 orchestrateChat 호출 전
 * 반환값이 null이 아니면 Schift 호출 전부 스킵하고 즉시 응답.
 */

import type { ChatMessage } from "@gynecology-chatbot/app-core";
import type { PromptContext } from "./chat-repository";
import type {
  WorkflowAssistantPayload,
  WorkflowScenario,
  CharacterTone,
} from "./workflow-payload";

/** 하루에 제공하는 오늘의 질문(attachment_question) 수. 소진 시 자유대화/종료 선택 */
export const DAILY_ATTACHMENT_QUESTION_QUOTA = 3;

const CLOSING_SIGNAL =
  /괜찮아졌|위로됐|고마워요|이제 됐|좀 가벼워졌|오늘은 여기까지|이만 마칠|마칠게요|여기까지 할/;
const POSITIVE_ACK = /^(네|응|예|좋아|보여|볼래|알려|확인할래요)/;

export type StageShortcutInput = {
  userText: string;
  selectedMood: string | null;
  /**
   * 이번 턴에 사용자가 quickReply로 막 고른 질문 ID.
   * null 이면 텍스트 입력 또는 다른 UI 액션.
   */
  selectedQuestionId: string | null;
  currentWeek: number | null;
  promptContext: PromptContext | null;
  moodPool: Array<{ label: string; message: string; tone: CharacterTone }>;
  weekInfoOptInVariations: string[];
  todayQuestionCandidates: Array<{ id: string; text: string }>;
  /**
   * 라우트가 SQL(user_question_events) 에서 조회해 주입.
   * - answeredQuestionIds: 오늘 이미 답한 질문 id 들
   * - currentAttachmentQuestionId: 이 세션에서 현재 대화 중인 질문 id
   *   (status='sent' AND answered_at IS NULL 의 최신 레코드)
   *
   * 미지정 시 빈 진행 상태(`{answered:[], current:null}`) 로 처리.
   */
  progress?: QuestionProgress;
  rngSeed?: number;
};

/**
 * 답변 완료 질문 ID 누적 리스트 + 현재 대화 중인 질문 ID.
 * 진실 소스: user_question_events (status='answered' / 'sent')
 */
export type QuestionProgress = {
  answeredQuestionIds: string[];
  currentAttachmentQuestionId: string | null;
};

export type StageShortcutResult = {
  assistantMessage: ChatMessage;
  workflowMemoryPayload: WorkflowAssistantPayload;
  sideEffects?: {
    fireMoodWebhook?: { moodId: string; moodLabel: string };
    saveQuestionSummary?: {
      questionId: string;
      questionText: string;
      userAnswer: string;
      compactSummary: string | null;
    };
  };
};

function now() {
  return Date.now();
}

function pickRandom<T>(items: T[], seed?: number): T {
  if (items.length === 0) throw new Error("empty pool");
  const idx =
    seed !== undefined
      ? Math.abs(seed) % items.length
      : Math.floor(Math.random() * items.length);
  return items[idx];
}

function makeText(text: string): ChatMessage["parts"][number] {
  return { type: "text", id: `text-${now()}`, text };
}

function makeQuickReplies(
  choices: Array<{ id: string; label: string; message: string }>,
): ChatMessage["parts"][number] {
  return { type: "quickReplies", id: `quick-${now()}`, choices };
}

function assistantMessage(parts: ChatMessage["parts"]): ChatMessage {
  return {
    id: `assistant-shortcut-${now()}`,
    role: "assistant",
    createdAtLabel: "방금 전",
    parts,
  };
}

// ────────────────────────────────────────────────────────────
// stage=0 mood 첫 턴 (selectedMood 없음) → mood prompt
// ────────────────────────────────────────────────────────────
function buildMoodIntakeTurn(input: StageShortcutInput): StageShortcutResult {
  const five = input.moodPool.slice(0, Math.min(5, input.moodPool.length));
  return {
    assistantMessage: assistantMessage([
      makeText("오늘 기분은 어떠세요? 편하게 골라봐요."),
      makeQuickReplies(
        five.map((m, i) => ({
          id: `mood-${i}`,
          label: m.label,
          message: m.message,
        })),
      ),
    ]),
    workflowMemoryPayload: {
      scenario: "emotion_checkin",
      characterTone: "calm",
      guardrailStatus: "safe",
      nextSessionMemory: {
        workflowVersion: 2,
        stage: 0,
        stageName: "mood_intake",
        compactSummary: "현재 단계: 감정 확인",
        lastScenario: "emotion_checkin",
        lastCharacterTone: "calm",
      },
    },
  };
}

// ────────────────────────────────────────────────────────────
// stage=0 mood 방금 들어옴 → webhook + week_info_opt_in 프롬프트
// ────────────────────────────────────────────────────────────
function buildWeekInfoOptInTurn(
  input: StageShortcutInput,
): StageShortcutResult {
  const prompt = pickRandom(input.weekInfoOptInVariations, input.rngSeed);
  const mood = input.selectedMood!;
  const moodEntry = input.moodPool.find((m) => m.message === mood) ?? null;
  const moodTone: CharacterTone = moodEntry?.tone ?? "calm";

  return {
    assistantMessage: assistantMessage([
      makeText(`그 마음 기억해둘게요.\n\n${prompt}`),
      makeQuickReplies([
        {
          id: "week-info-yes",
          label: "네, 볼래요",
          message: "네, 오늘 주차 정보 볼래요.",
        },
        {
          id: "week-info-no",
          label: "이따가요",
          message: "아니요, 이따가 확인할래요.",
        },
      ]),
    ]),
    workflowMemoryPayload: {
      scenario: "baby_info_offer",
      characterTone: moodTone,
      guardrailStatus: "safe",
      nextSessionMemory: {
        workflowVersion: 2,
        stage: 0,
        stageName: "week_info_opt_in",
        moodId: mood,
        moodLabel: moodEntry?.label ?? mood,
        compactSummary: "현재 단계: 태아 발달 확인 제안",
        lastScenario: "baby_info_offer",
        lastCharacterTone: moodTone,
        lastEmotionTone: moodTone,
      },
      nextProfileMemory: { lastEmotionTone: moodTone },
    },
    sideEffects: {
      fireMoodWebhook: {
        moodId: mood,
        moodLabel: moodEntry?.label ?? mood,
      },
    },
  };
}

// ────────────────────────────────────────────────────────────
// stage=1 today_question 제시 (quickReplies 2개)
// ────────────────────────────────────────────────────────────
function buildTodayQuestionTurn(
  input: StageShortcutInput,
  progress: QuestionProgress,
): StageShortcutResult {
  const answered = new Set(progress.answeredQuestionIds);
  const candidates = input.todayQuestionCandidates.filter(
    (q) => !answered.has(q.id),
  );
  const remaining = candidates.slice(0, 2);

  if (remaining.length === 0) {
    return buildExhaustedChoiceTurn(progress);
  }

  return {
    assistantMessage: assistantMessage([
      makeText(
        "오늘 해본 만큼으로도 충분해요. 아래 질문 중 하나를 골라보세요.",
      ),
      makeQuickReplies(
        remaining.map((q) => ({
          id: q.id,
          label: q.text,
          message: q.text,
        })),
      ),
    ]),
    workflowMemoryPayload: {
      scenario: "attachment_question",
      characterTone: "calm",
      guardrailStatus: "safe",
      // 이번 턴에 "보여준" 후보들
      offeredQuestionIds: remaining.map((q) => q.id),
      // 누적 상태 그대로 유지
      selectedQuestionIds: progress.answeredQuestionIds,
      currentAttachmentQuestionId: null,
      nextSessionMemory: {
        workflowVersion: 2,
        stage: 1,
        stageName: "today_question",
        compactSummary: `현재 단계: 모아애착 질문 (${progress.answeredQuestionIds.length}/${DAILY_ATTACHMENT_QUESTION_QUOTA} 답변 완료)`,
        lastScenario: "attachment_question",
        lastCharacterTone: "calm",
        answeredQuestionIds: progress.answeredQuestionIds,
        currentAttachmentQuestionId: null,
      } as Record<string, unknown>,
    } as WorkflowAssistantPayload,
  };
}

// ────────────────────────────────────────────────────────────
// 하루치 질문 소진 → 자유대화 / 종료 선택
// ────────────────────────────────────────────────────────────
function buildExhaustedChoiceTurn(
  progress: QuestionProgress,
): StageShortcutResult {
  return {
    assistantMessage: assistantMessage([
      makeText("오늘 준비된 질문은 다 함께 봤어요. 조금 더 이야기 나눠볼까요?"),
      makeQuickReplies([
        {
          id: "free-chat",
          label: "자유롭게 대화할래요",
          message: "자유롭게 대화하고 싶어요.",
        },
        {
          id: "end-session",
          label: "여기까지 할래요",
          message: "오늘은 여기까지 할게요.",
        },
      ]),
    ]),
    workflowMemoryPayload: {
      scenario: "general",
      characterTone: "calm",
      guardrailStatus: "safe",
      selectedQuestionIds: progress.answeredQuestionIds,
      currentAttachmentQuestionId: null,
      nextSessionMemory: {
        workflowVersion: 2,
        stage: 2,
        stageName: "exhausted_choice",
        compactSummary: "현재 단계: 자유대화/종료 선택",
        lastScenario: "general",
        lastCharacterTone: "calm",
        answeredQuestionIds: progress.answeredQuestionIds,
        currentAttachmentQuestionId: null,
      } as Record<string, unknown>,
    } as WorkflowAssistantPayload,
  };
}

// ────────────────────────────────────────────────────────────
// 종료 턴 → summary webhook 트리거 + 빈 응답
// ────────────────────────────────────────────────────────────
function buildEndedTurn(): StageShortcutResult {
  return {
    assistantMessage: assistantMessage([
      makeText("오늘 이야기해줘서 고마워요. 또 만나요."),
    ]),
    workflowMemoryPayload: {
      scenario: "general",
      characterTone: "calm",
      guardrailStatus: "safe",
      nextSessionMemory: {
        workflowVersion: 2,
        stage: "ended",
        stageName: "ended",
        compactSummary: "현재 단계: 종료 요약",
        lastScenario: "general",
        lastCharacterTone: "calm",
      },
    },
  };
}

// ────────────────────────────────────────────────────────────
// 메인 엔트리
// ────────────────────────────────────────────────────────────
export function maybeShortCircuitStaticTurn(
  input: StageShortcutInput,
): StageShortcutResult | null {
  const memory = input.promptContext?.sessionMemory ?? null;
  const rawStage = memory?.stage ?? null;
  const compactSummary = memory?.compactSummary ?? "";
  const lastScenario = memory?.lastScenario ?? "";
  const progress: QuestionProgress = input.progress ?? {
    answeredQuestionIds: [],
    currentAttachmentQuestionId: null,
  };

  // SQL 기반 progress 가 진실 소스.
  const stage: number | string | null =
    progress.currentAttachmentQuestionId && !input.selectedQuestionId
      ? 2
      : rawStage;

  // ── 공통 우선 규칙: 사용자가 "아니요/이따가/나중/싫어요" 로 거절하거나
  //    "오늘의 질문" 으로 이어가고 싶다고 하면 stage 무관 바로 stage=1 today_question 제시.
  //    이전 상태가 baby_info_offer/week_info_opt_in 이면 특히 중요 (loop 방지).
  const isRefusal = /이따가|아니요|나중|안 볼래|안볼래|싫어요|됐어요|패스/.test(
    input.userText,
  );
  const wantsQuestion =
    /오늘의 질문|질문으로 이어|질문 볼래|질문 할래|질문 해볼래/.test(
      input.userText,
    );
  const isInfoContext =
    lastScenario === "baby_info_offer" ||
    (lastScenario as string) === "week_info_opt_in" ||
    lastScenario === "baby_info" ||
    compactSummary.includes("태아 발달 확인 제안") ||
    compactSummary.includes("주차 정보 안내");
  if (
    !input.selectedQuestionId &&
    !progress.currentAttachmentQuestionId &&
    (isRefusal || wantsQuestion) &&
    (isInfoContext || stage === 0 || stage === 1 || stage === null)
  ) {
    return buildTodayQuestionTurn(input, progress);
  }

  // 첫 진입: stage 없음 → mood intake
  if (stage === null && !input.selectedMood) {
    return buildMoodIntakeTurn(input);
  }

  if (stage === 0) {
    // mood 직전 선택됨 → webhook + week_info_opt_in
    if (input.selectedMood && !compactSummary.includes("태아 발달 확인 제안")) {
      return buildWeekInfoOptInTurn(input);
    }
    // "N" (이따가요) → stage=1 today_question으로
    if (/이따가|아니요|나중|안 볼래|안볼래/.test(input.userText)) {
      return buildTodayQuestionTurn(input, progress);
    }
    // "오늘의 질문으로 이어갈래요" / "질문으로 이어" / "질문 볼래요" → stage=1
    // (Y path 주차 정보 응답 이후 사용자가 질문으로 가고 싶을 때)
    if (/오늘의 질문|질문으로 이어|질문 볼래|질문 할래/.test(input.userText)) {
      return buildTodayQuestionTurn(input, progress);
    }
    // "Y" (네, 볼래요) → 주차 정보는 Schift LLM 경로로 넘기거나 별도 deep link 로직
    return null;
  }

  if (stage === 1) {
    // 사용자가 질문 선택 안 했고 attachment_question 턴 재진입
    if (!input.selectedQuestionId) {
      return buildTodayQuestionTurn(input, progress);
    }
    // 질문 선택됨 → "이 질문에 대해 편지 써볼까요?" 전환 턴 (LLM 없이 즉시 응답)
    //  다음 턴에 사용자가 실제 편지를 쓰면 stage=2 LLM 로 letter_reflection 경로.
    const pickedQuestion = input.todayQuestionCandidates.find(
      (q) => q.id === input.selectedQuestionId,
    );
    const questionText =
      (pickedQuestion?.text ?? input.userText.trim()) || "오늘의 질문";
    return {
      assistantMessage: assistantMessage([
        makeText(
          [
            `"${questionText}"`,
            "",
            "이 질문에 대해 편안하게 답해주세요. 아기에게 들려주는 편지처럼 써도 좋고, 떠오르는 한 문장이어도 괜찮아요.",
          ].join("\n"),
        ),
      ]),
      workflowMemoryPayload: {
        scenario: "attachment_question",
        characterTone: "calm",
        guardrailStatus: "safe",
        selectedQuestionIds: [input.selectedQuestionId],
        currentAttachmentQuestionId: input.selectedQuestionId,
        nextSessionMemory: {
          workflowVersion: 2,
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: `현재 단계: 질문 답변 대기 (${input.selectedQuestionId})`,
          lastScenario: "attachment_question",
          lastCharacterTone: "calm",
          answeredQuestionIds: progress.answeredQuestionIds,
          currentAttachmentQuestionId: input.selectedQuestionId,
        } as Record<string, unknown>,
      } as WorkflowAssistantPayload,
    };
  }

  if (stage === 2) {
    // exhausted_choice 상태에서 종료 선택 처리
    if (
      memory?.stageName === "exhausted_choice" &&
      /오늘은 여기까지|여기까지 할래요/.test(input.userText)
    ) {
      return buildEndedTurn();
    }
    // 마무리 신호 → 현재 질문을 answered 에 push, 소진 여부 판단
    if (CLOSING_SIGNAL.test(input.userText)) {
      const updated: QuestionProgress = {
        answeredQuestionIds:
          progress.currentAttachmentQuestionId &&
          !progress.answeredQuestionIds.includes(
            progress.currentAttachmentQuestionId,
          )
            ? [
                ...progress.answeredQuestionIds,
                progress.currentAttachmentQuestionId,
              ]
            : progress.answeredQuestionIds,
        currentAttachmentQuestionId: null,
      };
      if (
        updated.answeredQuestionIds.length >= DAILY_ATTACHMENT_QUESTION_QUOTA
      ) {
        return buildExhaustedChoiceTurn(updated);
      }
      return buildTodayQuestionTurn(input, updated);
    }
    // "자유대화" 선택 → free_chat 전환 (종료 escape hatch 포함)
    if (/자유롭게/.test(input.userText)) {
      return {
        assistantMessage: assistantMessage([
          makeText(
            "편하게 이야기 이어갈게요. 오늘 나누고 싶은 이야기가 있으세요?",
          ),
          makeQuickReplies([
            {
              id: "free-chat-topic-body",
              label: "몸 상태 이야기",
              message: "요즘 몸 상태가 어떤지 이야기하고 싶어요.",
            },
            {
              id: "free-chat-topic-feeling",
              label: "오늘 기분",
              message: "오늘 기분을 조금 더 나누고 싶어요.",
            },
            {
              id: "end-session",
              label: "여기까지 할래요",
              message: "오늘은 여기까지 할게요.",
            },
          ]),
        ]),
        workflowMemoryPayload: {
          scenario: "general",
          characterTone: "calm",
          guardrailStatus: "safe",
          nextSessionMemory: {
            workflowVersion: 2,
            stage: "free_chat",
            stageName: "free_chat",
            compactSummary: "현재 단계: 자유 대화",
            lastScenario: "general",
            lastCharacterTone: "calm",
          },
        },
      };
    }
    // 나머지 → LLM 경로
    return null;
  }

  if (stage === "free_chat") {
    // 자유대화 중 명시적 종료 신호만 가로채고, 나머지는 LLM
    if (
      /오늘은 여기까지|여기까지 할래요|이만 마칠|마칠게요/.test(input.userText)
    ) {
      return buildEndedTurn();
    }
    return null;
  }

  if (stage === "ended") {
    return buildEndedTurn();
  }

  return null;
}
