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
  selectedQuestionId: string | null;
  currentWeek: number | null;
  promptContext: PromptContext | null;
  moodPool: Array<{ label: string; message: string; tone: CharacterTone }>;
  weekInfoOptInVariations: string[];
  todayQuestionCandidates: Array<{ id: string; text: string }>;
  rngSeed?: number;
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
  selectedAnswered: Set<string>,
): StageShortcutResult {
  const candidates = input.todayQuestionCandidates.filter(
    (q) => !selectedAnswered.has(q.id),
  );
  const remaining = candidates.slice(0, 2);

  if (remaining.length === 0) {
    return buildExhaustedChoiceTurn();
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
      selectedQuestionIds: remaining.map((q) => q.id),
      nextSessionMemory: {
        workflowVersion: 2,
        stage: 1,
        stageName: "today_question",
        compactSummary: "현재 단계: 모아애착 질문",
        lastScenario: "attachment_question",
        lastCharacterTone: "calm",
      },
    },
  };
}

// ────────────────────────────────────────────────────────────
// 하루치 질문 소진 → 자유대화 / 종료 선택
// ────────────────────────────────────────────────────────────
function buildExhaustedChoiceTurn(): StageShortcutResult {
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
      nextSessionMemory: {
        workflowVersion: 2,
        stage: 2,
        stageName: "exhausted_choice",
        compactSummary: "현재 단계: 자유대화/종료 선택",
        lastScenario: "general",
        lastCharacterTone: "calm",
      },
    },
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
  const stage = memory?.stage ?? null;
  const compactSummary = memory?.compactSummary ?? "";
  const selectedQuestionIds = new Set(
    (memory as { selectedQuestionIds?: string[] })?.selectedQuestionIds ?? [],
  );

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
      return buildTodayQuestionTurn(input, selectedQuestionIds);
    }
    // "Y" (네, 볼래요) → 주차 정보는 Schift LLM 경로로 넘기거나 별도 deep link 로직
    // 여기서는 short-circuit 안 함 (LLM 필요)
    return null;
  }

  if (stage === 1) {
    // 사용자가 질문 선택 안 했고 attachment_question 턴 재진입
    if (!input.selectedQuestionId) {
      return buildTodayQuestionTurn(input, selectedQuestionIds);
    }
    // 질문 선택됨 → LLM 경로 (stage=2 conversation)
    return null;
  }

  if (stage === 2) {
    // exhausted_choice 상태에서 종료 선택 처리
    if (
      memory?.stageName === "exhausted_choice" &&
      /오늘은 여기까지|여기까지 할래요/.test(input.userText)
    ) {
      return buildEndedTurn();
    }
    // 소진 체크: 마무리 신호 + selectedQuestionIds 가득 차면 자유대화/종료 선택
    if (
      CLOSING_SIGNAL.test(input.userText) &&
      selectedQuestionIds.size >= DAILY_ATTACHMENT_QUESTION_QUOTA
    ) {
      return buildExhaustedChoiceTurn();
    }
    // 마무리 신호만: 아직 질문 남음 → 2차 질문 안내
    if (
      CLOSING_SIGNAL.test(input.userText) &&
      selectedQuestionIds.size < DAILY_ATTACHMENT_QUESTION_QUOTA
    ) {
      return buildTodayQuestionTurn(input, selectedQuestionIds);
    }
    // "자유대화" 선택 → free_chat 전환
    if (/자유롭게/.test(input.userText)) {
      return {
        assistantMessage: assistantMessage([
          makeText("편하게 이야기 이어갈게요. 어떤 얘기 하고 싶어요?"),
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
