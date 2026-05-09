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
import {
  ACTIVE_QUESTION_REQUIRED_TEMPLATE,
  REQUIRED_TODAY_QUESTION_NOTICE_TEXT,
  type ChatFlowConfig,
  type ChatFlowQuickReply,
} from "./chat-flow-config";
import {
  DIRECT_INPUT_MOOD_ACKNOWLEDGEMENT_TEXT,
  DIRECT_INPUT_MOOD_LABEL,
  DIRECT_INPUT_MOOD_MESSAGE,
} from "./initial-workflow-message";
import type {
  WorkflowAssistantPayload,
  WorkflowScenario,
  CharacterTone,
} from "./workflow-payload";

/** 하루에 제공하는 오늘의 질문(attachment_question) 수. 소진 시 자유대화/종료 선택 */
export const DAILY_ATTACHMENT_QUESTION_QUOTA = 3;

function getEffectiveQuestionQuota(input: StageShortcutInput) {
  return Math.min(
    input.effectiveQuestionQuota ?? DAILY_ATTACHMENT_QUESTION_QUOTA,
    DAILY_ATTACHMENT_QUESTION_QUOTA,
  );
}

export const QUESTION_CHIP_SUMMARY_ENABLED_ENV =
  "QUESTION_CHIP_SUMMARY_ENABLED";

function isQuestionChipSummaryEnabled() {
  return process.env[QUESTION_CHIP_SUMMARY_ENABLED_ENV] === "true";
}

export function summarizeQuestionForChip(text: string): string {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return text;
  const sentences = trimmed.match(/[^.!?。！？\n]+[.!?。！？]/g);
  if (sentences && sentences.length > 0) {
    for (let i = sentences.length - 1; i >= 0; i -= 1) {
      const s = sentences[i]!.trim();
      if (/[?？]$/.test(s)) return s;
    }
    return sentences[sentences.length - 1]!.trim();
  }
  return trimmed;
}

export function buildQuestionChipLabel(text: string): string {
  return isQuestionChipSummaryEnabled() ? summarizeQuestionForChip(text) : text;
}

// 명시적 종료/다음 질문 전환 신호만. "고마워요" 같은 짧은 감사 표현은 제외 —
// 질문 하나당 2~3턴 공감 대화가 이어지도록.
const CLOSING_SIGNAL = /다음 질문/;
const STOP_SIGNAL =
  /오늘은 여기까지|이만 마칠|마칠게요|여기까지 할|여기까지만|그만할게요|그만 할게요/;
const POSITIVE_ACK = /^(네|응|예|좋아|보여|볼래|알려|확인할래요)/;
const DIRECT_MOOD_LABELS = new Set(["직접 입력", DIRECT_INPUT_MOOD_LABEL]);

const MOOD_ACKNOWLEDGEMENTS: Record<CharacterTone, string[]> = {
  joyful: [
    "좋은 마음이 느껴져서 저도 반가워요.",
    "그 밝은 기분을 오늘 안에서 잘 간직해봐요.",
    "좋아요, 지금의 따뜻한 마음을 함께 기억해둘게요.",
  ],
  sad: [
    "울적한 마음을 꺼내줘서 고마워요.",
    "슬픈 마음이 올라온 하루였군요.",
    "그 마음이 혼자만의 일이 되지 않게 여기서 함께 볼게요.",
  ],
  anxious: [
    "마음이 조금 긴장되어 있었군요.",
    "걱정되는 마음을 말해줘서 고마워요.",
    "답답하고 예민한 마음이 올라올 수 있어요.",
  ],
  tired: [
    "몸과 마음이 많이 지친 날이군요.",
    "피곤한 마음을 알아차리고 말해줘서 고마워요.",
    "오늘은 속도를 조금 늦춰도 괜찮아요.",
  ],
  calm: [
    "차분하게 지금 마음을 살펴보고 계시군요.",
    "편안한 마음을 그대로 잘 이어가봐요.",
    "좋아요, 지금의 마음을 조용히 함께 기억해둘게요.",
  ],
};

export type StageShortcutInput = {
  userText: string;
  selectedMood: string | null;
  /**
   * 이번 턴에 사용자가 quickReply로 막 고른 질문 ID.
   * null 이면 텍스트 입력 또는 다른 UI 액션.
   */
  selectedQuestionId: string | null;
  transientWorkflowStage?: number | string | null;
  transientLastScenario?: string | null;
  currentWeek: number | null;
  promptContext: PromptContext | null;
  moodPool: Array<{ label: string; message: string; tone: CharacterTone }>;
  moodPromptText?: string;
  moodAcknowledgementPool?: string[];
  weekInfoOptInVariations: string[];
  flowConfig?: ChatFlowConfig;
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
  effectiveQuestionQuota?: number;
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

function stripWrappingQuoteMarks(value: string) {
  return value
    .trim()
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "")
    .trim();
}

function formatAttachmentQuestionPrompt(questionText: string) {
  const content = stripWrappingQuoteMarks(questionText) || "오늘의 질문";
  return `**"${content}"**`;
}

function makeQuickReplies(
  choices: Array<{ id: string; label: string; message: string }>,
): ChatMessage["parts"][number] {
  return { type: "quickReplies", id: `quick-${now()}`, choices };
}

function makeConfiguredQuickReplies(
  choices: ChatFlowQuickReply[],
): ChatMessage["parts"][number] {
  return makeQuickReplies(choices);
}

function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (match, key) =>
    key in vars ? vars[key]! : match,
  );
}

function formatQuestionTemplateValue(value: string) {
  return stripWrappingQuoteMarks(value);
}

function getMoodPrompts(input: StageShortcutInput) {
  return input.moodPool.length > 0
    ? input.moodPool
    : (input.flowConfig?.moodIntake.moodPrompts ?? input.moodPool);
}

function isDirectMoodEntry(
  entry: { label: string; message: string } | null,
): boolean {
  if (!entry) {
    return false;
  }

  return (
    DIRECT_MOOD_LABELS.has(entry.label) ||
    entry.message.replace(/\s+/g, " ").trim() === DIRECT_INPUT_MOOD_MESSAGE
  );
}

function getTodayQuestionCompactSummary(
  input: StageShortcutInput,
  progress: QuestionProgress,
) {
  return renderTemplate(
    input.flowConfig?.todayQuestion.compactSummaryTemplate ??
      "현재 단계: 모아애착 질문 ({{answeredCount}}/{{quota}} 답변 완료)",
    {
      answeredCount: String(progress.answeredQuestionIds.length),
      quota: String(getEffectiveQuestionQuota(input)),
    },
  );
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
  const moodPrompts = getMoodPrompts(input);
  const five = moodPrompts.slice(0, Math.min(5, moodPrompts.length));
  return {
    assistantMessage: assistantMessage([
      makeText(
        input.flowConfig?.moodIntake.promptText ??
          input.moodPromptText ??
          "오늘 기분은 어떠세요? 편하게 골라봐요.",
      ),
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
  const prompt = pickRandom(
    input.flowConfig?.weekInfoOptIn.answerVariations ??
      input.weekInfoOptInVariations,
    input.rngSeed,
  );
  const mood = input.selectedMood!;
  const moodPool = getMoodPrompts(input);
  const moodEntry = moodPool.find((m) => m.message === mood) ?? null;
  const moodTone: CharacterTone = moodEntry?.tone ?? "calm";
  const yamlAcknowledgements =
    input.flowConfig?.moodIntake.acknowledgementsByTone[moodTone];
  const acknowledgement = isDirectMoodEntry(moodEntry)
    ? (input.flowConfig?.moodIntake.directInputAcknowledgementText ??
      DIRECT_INPUT_MOOD_ACKNOWLEDGEMENT_TEXT)
    : pickRandom(
        yamlAcknowledgements && yamlAcknowledgements.length > 0
          ? yamlAcknowledgements
          : input.moodAcknowledgementPool &&
              input.moodAcknowledgementPool.length > 0
            ? input.moodAcknowledgementPool
            : MOOD_ACKNOWLEDGEMENTS[moodTone],
        input.rngSeed === undefined ? undefined : input.rngSeed + 1,
      );
  const quickReplies = input.flowConfig?.weekInfoOptIn.quickReplies;

  return {
    assistantMessage: assistantMessage([
      makeText(`${acknowledgement}\n\n${prompt}`),
      makeConfiguredQuickReplies(
        quickReplies
          ? [quickReplies.yes, quickReplies.no]
          : [
              {
                id: "week-info-yes",
                label: "네",
                message: "네, 오늘 주차 정보 볼래요.",
              },
              {
                id: "week-info-no",
                label: "나중에요",
                message: "나중에 볼게요.",
              },
            ],
      ),
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
// stage=1 today_question 제시
// ────────────────────────────────────────────────────────────
function buildTodayQuestionTurn(
  input: StageShortcutInput,
  progress: QuestionProgress,
): StageShortcutResult {
  const answered = new Set(progress.answeredQuestionIds);
  const candidates = input.todayQuestionCandidates.filter(
    (q) => !answered.has(q.id),
  );
  const remaining = candidates;

  if (remaining.length === 0) {
    return buildExhaustedChoiceTurn(progress, input);
  }

  return {
    assistantMessage: assistantMessage([
      makeText(
        input.flowConfig?.todayQuestion.promptText ??
          "아래 질문 중 하나를 골라 이어가요.",
      ),
      makeQuickReplies(
        remaining.map((q) => ({
          id: q.id,
          label: buildQuestionChipLabel(q.text),
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
        compactSummary: getTodayQuestionCompactSummary(input, progress),
        lastScenario: "attachment_question",
        lastCharacterTone: "calm",
        answeredQuestionIds: progress.answeredQuestionIds,
        currentAttachmentQuestionId: null,
        currentQuestionTurnCount: 0,
      } as Record<string, unknown>,
    } as WorkflowAssistantPayload,
  };
}

function getRemainingQuestions(
  input: StageShortcutInput,
  progress: QuestionProgress,
) {
  const answered = new Set(progress.answeredQuestionIds);
  return input.todayQuestionCandidates.filter((q) => !answered.has(q.id));
}

function hasRemainingRequiredQuestions(
  input: StageShortcutInput,
  progress: QuestionProgress,
) {
  return (
    progress.answeredQuestionIds.length < getEffectiveQuestionQuota(input) &&
    getRemainingQuestions(input, progress).length > 0
  );
}

function resolveSelectedQuestionId(input: StageShortcutInput) {
  const selected = input.selectedQuestionId?.trim();
  if (!selected) return null;
  return input.todayQuestionCandidates.some((q) => q.id === selected)
    ? selected
    : null;
}

// ────────────────────────────────────────────────────────────
// 하루치 질문 소진 → 자유대화 / 종료 선택
// ────────────────────────────────────────────────────────────
function buildExhaustedChoiceTurn(
  progress: QuestionProgress,
  input?: StageShortcutInput,
): StageShortcutResult {
  return {
    assistantMessage: assistantMessage([
      makeText(
        input?.flowConfig?.exhaustedChoice.answerText ??
          "오늘의 질문을 모두 답변하셨어요. 이제 자유롭게 얘기해보아요.",
      ),
    ]),
    workflowMemoryPayload: {
      scenario: "general",
      characterTone: "calm",
      guardrailStatus: "safe",
      selectedQuestionIds: progress.answeredQuestionIds,
      currentAttachmentQuestionId: null,
      nextSessionMemory: {
        workflowVersion: 2,
        stage: "free_chat",
        stageName: "free_chat",
        compactSummary: "현재 단계: 자유 대화",
        lastScenario: "general",
        lastCharacterTone: "calm",
        answeredQuestionIds: progress.answeredQuestionIds,
        currentAttachmentQuestionId: null,
        currentQuestionTurnCount: 0,
      } as Record<string, unknown>,
    } as WorkflowAssistantPayload,
  };
}

function buildBlockedTodayQuestionTurn(
  input: StageShortcutInput,
  progress: QuestionProgress,
): StageShortcutResult {
  if (!hasRemainingRequiredQuestions(input, progress)) {
    return buildExhaustedChoiceTurn(progress, input);
  }

  return {
    assistantMessage: assistantMessage([
      makeText(
        input.flowConfig?.todayQuestion.blockedText ??
          REQUIRED_TODAY_QUESTION_NOTICE_TEXT,
      ),
      makeQuickReplies(
        getRemainingQuestions(input, progress).map((q) => ({
          id: q.id,
          label: buildQuestionChipLabel(q.text),
          message: q.text,
        })),
      ),
    ]),
    workflowMemoryPayload: {
      scenario: "attachment_question",
      characterTone: "calm",
      guardrailStatus: "safe",
      offeredQuestionIds: getRemainingQuestions(input, progress).map(
        (q) => q.id,
      ),
      selectedQuestionIds: progress.answeredQuestionIds,
      currentAttachmentQuestionId: null,
      nextSessionMemory: {
        workflowVersion: 2,
        stage: 1,
        stageName: "today_question",
        compactSummary: getTodayQuestionCompactSummary(input, progress),
        lastScenario: "attachment_question",
        lastCharacterTone: "calm",
        answeredQuestionIds: progress.answeredQuestionIds,
        currentAttachmentQuestionId: null,
        currentQuestionTurnCount: 0,
      } as Record<string, unknown>,
    } as WorkflowAssistantPayload,
  };
}

function buildDeferredWeekInfoQuestionTurn(
  input: StageShortcutInput,
  progress: QuestionProgress,
): StageShortcutResult {
  const answered = new Set(progress.answeredQuestionIds);
  const remaining = input.todayQuestionCandidates.filter(
    (q) => !answered.has(q.id),
  );

  if (remaining.length === 0) {
    return buildExhaustedChoiceTurn(progress, input);
  }

  return {
    assistantMessage: assistantMessage([
      makeText(
        input.flowConfig?.todayQuestion.deferredWeekInfoText ??
          "사전은 나중에 봐도 좋아요. 아래 질문 중 하나를 골라 이어가요.",
      ),
      makeQuickReplies(
        remaining.map((q) => ({
          id: q.id,
          label: buildQuestionChipLabel(q.text),
          message: q.text,
        })),
      ),
    ]),
    workflowMemoryPayload: {
      scenario: "attachment_question",
      characterTone: "calm",
      guardrailStatus: "safe",
      offeredQuestionIds: remaining.map((q) => q.id),
      selectedQuestionIds: progress.answeredQuestionIds,
      currentAttachmentQuestionId: null,
      nextSessionMemory: {
        workflowVersion: 2,
        stage: 1,
        stageName: "today_question",
        compactSummary: getTodayQuestionCompactSummary(input, progress),
        lastScenario: "attachment_question",
        lastCharacterTone: "calm",
        answeredQuestionIds: progress.answeredQuestionIds,
        currentAttachmentQuestionId: null,
        currentQuestionTurnCount: 0,
      } as Record<string, unknown>,
    } as WorkflowAssistantPayload,
  };
}

function buildActiveQuestionRequiredTurn(
  input: StageShortcutInput,
  progress: QuestionProgress,
): StageShortcutResult {
  const currentQuestion = input.todayQuestionCandidates.find(
    (q) => q.id === progress.currentAttachmentQuestionId,
  );
  const questionText = currentQuestion?.text ?? "선택한 오늘의 질문";

  return {
    assistantMessage: assistantMessage([
      makeText(
        renderTemplate(
          input.flowConfig?.activeQuestionRequired.answerTemplate ??
            ACTIVE_QUESTION_REQUIRED_TEMPLATE,
          { questionText: formatQuestionTemplateValue(questionText) },
        ),
      ),
    ]),
    workflowMemoryPayload: {
      scenario: "attachment_question",
      characterTone: "calm",
      guardrailStatus: "safe",
      selectedQuestionIds: progress.answeredQuestionIds,
      currentAttachmentQuestionId: progress.currentAttachmentQuestionId,
      nextSessionMemory: {
        workflowVersion: 2,
        stage: 2,
        stageName: "choice_conversation",
        compactSummary: "현재 단계: 질문 답변 대기",
        lastScenario: "attachment_question",
        lastCharacterTone: "calm",
        answeredQuestionIds: progress.answeredQuestionIds,
        currentAttachmentQuestionId: progress.currentAttachmentQuestionId,
      } as Record<string, unknown>,
    } as WorkflowAssistantPayload,
  };
}

// ────────────────────────────────────────────────────────────
// 종료 턴 → summary webhook 트리거 + 빈 응답
// ────────────────────────────────────────────────────────────
function buildEndedTurn(input?: StageShortcutInput): StageShortcutResult {
  return {
    assistantMessage: assistantMessage([
      makeText(
        input?.flowConfig?.ended.answerText ??
          "오늘 이야기해줘서 고마워요. 또 만나요.",
      ),
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

function readMemoryCurrentAttachmentQuestionId(
  memory: PromptContext["sessionMemory"] | null,
): string | null {
  const value = (memory as { currentAttachmentQuestionId?: unknown } | null)
    ?.currentAttachmentQuestionId;
  return typeof value === "string" && value.trim() ? value : null;
}

function readMemoryAnsweredQuestionIds(
  memory: PromptContext["sessionMemory"] | null,
): string[] {
  const value = (memory as { answeredQuestionIds?: unknown } | null)
    ?.answeredQuestionIds;
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim() !== "",
      ),
    ),
  );
}

export function mergeQuestionProgressWithMemory(
  progress: QuestionProgress,
  memory: PromptContext["sessionMemory"] | null,
): QuestionProgress {
  const answeredQuestionIds = Array.from(
    new Set([
      ...readMemoryAnsweredQuestionIds(memory),
      ...progress.answeredQuestionIds,
    ]),
  );
  const memoryCurrent = readMemoryCurrentAttachmentQuestionId(memory);
  const currentCandidate =
    memoryCurrent ?? progress.currentAttachmentQuestionId ?? null;
  const currentAttachmentQuestionId =
    currentCandidate && !answeredQuestionIds.includes(currentCandidate)
      ? currentCandidate
      : null;

  return {
    answeredQuestionIds,
    currentAttachmentQuestionId,
  };
}

// ────────────────────────────────────────────────────────────
// 메인 엔트리
// ────────────────────────────────────────────────────────────
export function maybeShortCircuitStaticTurn(
  input: StageShortcutInput,
): StageShortcutResult | null {
  const memory = input.promptContext?.sessionMemory ?? null;
  const rawStage = memory?.stage ?? input.transientWorkflowStage ?? null;
  const compactSummary = memory?.compactSummary ?? "";
  const lastScenario =
    memory?.lastScenario ?? input.transientLastScenario ?? "";
  const progress: QuestionProgress = mergeQuestionProgressWithMemory(
    input.progress ?? {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: null,
    },
    memory,
  );
  const selectedQuestionId = resolveSelectedQuestionId(input);

  // SQL 기반 progress 가 진실 소스.
  const stage: number | string | null =
    progress.currentAttachmentQuestionId && !selectedQuestionId
      ? 2
      : rawStage;

  // ── 공통 우선 규칙: 사용자가 "아니요/이따가/나중/싫어요" 로 거절하면
  //    오늘의 질문을 바로 띄우지 않고 짧게 마무리한다.
  //    "오늘의 질문" 으로 이어가고 싶다고 하면 stage=1 today_question 제시.
  //    이전 상태가 baby_info_offer/week_info_opt_in 이면 특히 중요 (loop 방지).
  const isRefusal =
    /이따가|아니요|나중|안 볼래|안볼래|싫어요|됐어요|패스|싶지 않|안 하고 싶|말하기 싫|얘기하기 싫|이야기하기 싫/.test(
      input.userText,
    );
  const wantsQuestion =
    /오늘의 질문|오늘 질문|질문으로 이어|질문 보기|질문 볼래|질문 할래|질문 해볼래|질문에 답|함께 질문|질문을 하나|질문 고르/.test(
      input.userText,
    );
  const isInfoContext =
    lastScenario === "baby_info_offer" ||
    (lastScenario as string) === "week_info_opt_in" ||
    lastScenario === "baby_info" ||
    compactSummary.includes("태아 발달 확인 제안") ||
    compactSummary.includes("주차 정보 안내");
  if (
    !selectedQuestionId &&
    progress.currentAttachmentQuestionId &&
    isRefusal
  ) {
    return buildActiveQuestionRequiredTurn(input, progress);
  }
  if (
    !selectedQuestionId &&
    !progress.currentAttachmentQuestionId &&
    isRefusal &&
    (lastScenario === "baby_info_offer" ||
      (lastScenario as string) === "week_info_opt_in" ||
      compactSummary.includes("태아 발달 확인 제안") ||
      stage === 0)
  ) {
    return buildDeferredWeekInfoQuestionTurn(input, progress);
  }
  if (
    !selectedQuestionId &&
    !progress.currentAttachmentQuestionId &&
    isRefusal &&
    (lastScenario === "baby_info" ||
      compactSummary.includes("주차 정보 안내") ||
      stage === 1 ||
      stage === null)
  ) {
    return buildBlockedTodayQuestionTurn(input, progress);
  }

  if (
    !selectedQuestionId &&
    !progress.currentAttachmentQuestionId &&
    wantsQuestion &&
    (isInfoContext ||
      stage === 0 ||
      stage === 1 ||
      stage === null ||
      stage === "ended" ||
      stage === "free_chat")
  ) {
    return buildTodayQuestionTurn(input, progress);
  }

  // 첫 진입: 앱을 열어 아직 입력이 없을 때만 mood intake 를 보여준다.
  // 자유 입력은 shortcut 으로 해석하지 않고 그대로 AI 경로로 보낸다.
  if (stage === null && !input.userText.trim()) {
    return buildMoodIntakeTurn(input);
  }

  if (stage === 0) {
    // mood 직전 선택됨 → webhook + week_info_opt_in
    if (input.selectedMood && !compactSummary.includes("태아 발달 확인 제안")) {
      return buildWeekInfoOptInTurn(input);
    }
    // "N" (이따가요) → 오늘의 질문을 바로 띄우지 않고 마무리
    if (/이따가|아니요|나중|안 볼래|안볼래/.test(input.userText)) {
      return buildDeferredWeekInfoQuestionTurn(input, progress);
    }
    // "오늘의 질문으로 이어갈래요" / "질문으로 이어" / "질문 볼래요" → stage=1
    // (Y path 주차 정보 응답 이후 사용자가 질문으로 가고 싶을 때)
    if (
      /오늘의 질문|오늘 질문|질문으로 이어|질문 보기|질문 볼래|질문 할래|질문에 답|함께 질문|질문을 하나|질문 고르/.test(
        input.userText,
      )
    ) {
      return buildTodayQuestionTurn(input, progress);
    }
    // "Y" (네, 볼래요) → 주차 정보는 Schift LLM 경로로 넘기거나 별도 deep link 로직
    return null;
  }

  if (stage === 1) {
    // 사용자가 질문 선택 안 했고 attachment_question 턴 재진입
    if (!selectedQuestionId) {
      if (input.userText.trim()) {
        return buildBlockedTodayQuestionTurn(input, progress);
      }
      return buildTodayQuestionTurn(input, progress);
    }
    // 질문 선택됨 → "이 질문에 대해 편지 써볼까요?" 전환 턴 (LLM 없이 즉시 응답)
    //  다음 턴에 사용자가 실제 편지를 쓰면 stage=2 LLM 로 letter_reflection 경로.
    const pickedQuestion = input.todayQuestionCandidates.find(
      (q) => q.id === selectedQuestionId,
    );
    const questionText =
      (pickedQuestion?.text ?? input.userText.trim()) || "오늘의 질문";
    return {
      assistantMessage: assistantMessage([
        makeText(
          renderTemplate(
            input.flowConfig?.questionSelected.answerTemplate ??
              [
                formatAttachmentQuestionPrompt("{{questionText}}"),
                "",
                "이 질문에 대해 편안하게 답해주세요. 아기에게 들려주는 편지처럼 써도 좋고, 떠오르는 한 문장이어도 괜찮아요.",
              ].join("\n"),
            { questionText: formatQuestionTemplateValue(questionText) },
          ),
        ),
      ]),
      workflowMemoryPayload: {
        scenario: "attachment_question",
        characterTone: "calm",
        guardrailStatus: "safe",
        selectedQuestionIds: [selectedQuestionId],
        currentAttachmentQuestionId: selectedQuestionId,
        nextSessionMemory: {
          workflowVersion: 2,
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: `현재 단계: 질문 답변 대기 (${selectedQuestionId})`,
          lastScenario: "attachment_question",
          lastCharacterTone: "calm",
          answeredQuestionIds: progress.answeredQuestionIds,
          currentAttachmentQuestionId: selectedQuestionId,
          currentQuestionTurnCount: 0,
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
      return buildEndedTurn(input);
    }
    if (STOP_SIGNAL.test(input.userText)) {
      if (hasRemainingRequiredQuestions(input, progress)) {
        return progress.currentAttachmentQuestionId
          ? buildActiveQuestionRequiredTurn(input, progress)
          : buildBlockedTodayQuestionTurn(input, progress);
      }
      return buildExhaustedChoiceTurn(progress, input);
    }
    // 마무리 신호 → 현재 질문을 answered 에 push, 소진 여부 판단
    if (CLOSING_SIGNAL.test(input.userText)) {
      const currentQuestionId =
        progress.currentAttachmentQuestionId ??
        readMemoryCurrentAttachmentQuestionId(memory);
      const updated: QuestionProgress = {
        answeredQuestionIds:
          currentQuestionId &&
          !progress.answeredQuestionIds.includes(currentQuestionId)
            ? [...progress.answeredQuestionIds, currentQuestionId]
            : progress.answeredQuestionIds,
        currentAttachmentQuestionId: null,
      };
      if (
        updated.answeredQuestionIds.length >= getEffectiveQuestionQuota(input)
      ) {
        return buildExhaustedChoiceTurn(updated, input);
      }
      return buildTodayQuestionTurn(input, updated);
    }
    // "자유대화" 선택 → free_chat 전환 (종료 escape hatch 포함)
    if (/자유롭게/.test(input.userText)) {
      if (hasRemainingRequiredQuestions(input, progress)) {
        return progress.currentAttachmentQuestionId
          ? buildActiveQuestionRequiredTurn(input, progress)
          : buildBlockedTodayQuestionTurn(input, progress);
      }
      return {
        assistantMessage: assistantMessage([
          makeText(
            input.flowConfig?.freeChatIntro.answerText ??
              "편하게 이야기 이어갈게요. 오늘 나누고 싶은 이야기가 있으세요?",
          ),
          makeConfiguredQuickReplies(
            input.flowConfig?.freeChatIntro.quickReplies ?? [
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
            ],
          ),
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
    if (
      !selectedQuestionId &&
      hasRemainingRequiredQuestions(input, progress)
    ) {
      return buildTodayQuestionTurn(input, progress);
    }
    // 자유대화 중 명시적 종료 신호만 가로채고, 나머지는 LLM
    if (
      /오늘은 여기까지|여기까지 할래요|이만 마칠|마칠게요/.test(input.userText)
    ) {
      return buildEndedTurn(input);
    }
    return null;
  }

  if (stage === "ended") {
    return buildEndedTurn(input);
  }

  return null;
}
