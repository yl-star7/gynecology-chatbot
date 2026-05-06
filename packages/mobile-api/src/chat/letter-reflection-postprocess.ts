/**
 * letter_reflection subworkflow 응답 후처리.
 *
 * 질문 답변 직후에는 사용자가 자연스럽게 직접 입력을 이어갈 수 있게
 * quickReplies 를 숨긴다. 충분히 머문 뒤에만 다음 질문/자유대화 전환 버튼을
 * 하나 노출한다.
 */

export type QuickReply = {
  id?: string;
  label: string;
  message: string;
};

export type LetterReflectionPayload = {
  answer?: string;
  scenario?: string;
  quickReplies?: QuickReply[];
  nextSessionMemory?: Record<string, unknown>;
  [key: string]: unknown;
};

export type LetterReflectionQuickReplyMode = "hidden" | "assistive";
export type LetterReflectionRecentMessage = {
  role?: "user" | "assistant" | "system" | string;
  text?: string;
};
export type LetterReflectionLoopPolicy = {
  minUserTurnsBeforeNext: number;
  maxUserTurnsPerQuestion: number;
  quickReplyMode: LetterReflectionQuickReplyMode;
  wrapUpMessage: string;
  nextQuestionLabelTemplate: string;
  nextQuestionMessage: string;
  exhaustedFreeChatMessage: string;
};

export const QUESTION_EXHAUSTED_FREE_CHAT_MESSAGE =
  "오늘의 질문을 모두 답변하셨어요. 이제 자유롭게 얘기해보아요.";
export const QUESTION_WRAP_UP_MESSAGE =
  "오늘 질문은 여기까지 담아도 충분해요. 이 마음을 기억해둘게요.";
export const DEFAULT_LETTER_REFLECTION_LOOP_POLICY: LetterReflectionLoopPolicy =
  {
    minUserTurnsBeforeNext: 1,
    maxUserTurnsPerQuestion: 5,
    quickReplyMode: "hidden",
    wrapUpMessage: QUESTION_WRAP_UP_MESSAGE,
    nextQuestionLabelTemplate: "다른 질문도 볼래요 ({{remainingCount}}개)",
    nextQuestionMessage: "다음 질문으로 이어갈래요.",
    exhaustedFreeChatMessage: QUESTION_EXHAUSTED_FREE_CHAT_MESSAGE,
  };

type AssistantMessagePartLike = {
  type: string;
  id?: unknown;
  text?: unknown;
  choices?: unknown;
};

type AssistantMessageLike = {
  parts: AssistantMessagePartLike[];
};

function asPolicyRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asPolicyString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asPolicyInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const raw =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : fallback;
  const next = Number.isFinite(raw) ? Math.floor(raw) : fallback;
  return Math.min(max, Math.max(min, next));
}

export function normalizeLetterReflectionLoopPolicy(
  value: unknown,
  base: LetterReflectionLoopPolicy = DEFAULT_LETTER_REFLECTION_LOOP_POLICY,
): LetterReflectionLoopPolicy {
  const record = asPolicyRecord(value) ?? {};
  const minUserTurnsBeforeNext = asPolicyInt(
    record.minUserTurnsBeforeNext ?? record.min_user_turns_before_next,
    base.minUserTurnsBeforeNext,
    1,
    20,
  );
  const maxUserTurnsPerQuestion = asPolicyInt(
    record.maxUserTurnsPerQuestion ?? record.max_user_turns_per_question,
    base.maxUserTurnsPerQuestion,
    minUserTurnsBeforeNext,
    30,
  );
  const quickReplyModeValue = record.quickReplyMode ?? record.quick_reply_mode;
  const quickReplyMode =
    quickReplyModeValue === "assistive"
      ? "assistive"
      : quickReplyModeValue === "hidden"
        ? "hidden"
        : base.quickReplyMode;

  return {
    minUserTurnsBeforeNext,
    maxUserTurnsPerQuestion,
    quickReplyMode,
    wrapUpMessage: asPolicyString(
      record.wrapUpMessage ?? record.wrap_up_message,
      base.wrapUpMessage,
    ),
    nextQuestionLabelTemplate: asPolicyString(
      record.nextQuestionLabelTemplate ?? record.next_question_label_template,
      base.nextQuestionLabelTemplate,
    ),
    nextQuestionMessage: asPolicyString(
      record.nextQuestionMessage ?? record.next_question_message,
      base.nextQuestionMessage,
    ),
    exhaustedFreeChatMessage: asPolicyString(
      record.exhaustedFreeChatMessage ?? record.exhausted_free_chat_message,
      base.exhaustedFreeChatMessage,
    ),
  };
}

export function resolveLetterReflectionNextChipMinTurns(
  currentAttachmentQuestionId: string | null,
  policy: unknown = DEFAULT_LETTER_REFLECTION_LOOP_POLICY,
) {
  const normalized = normalizeLetterReflectionLoopPolicy(policy);
  if (!currentAttachmentQuestionId) {
    return normalized.maxUserTurnsPerQuestion;
  }

  return normalized.minUserTurnsBeforeNext;
}

function countUserTurnsFromRecentMessages(
  recentMessages: LetterReflectionRecentMessage[] | null | undefined,
) {
  const messages = Array.isArray(recentMessages) ? recentMessages : [];
  if (messages.length === 0) {
    return 0;
  }

  let promptIndex = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (
      message.role === "assistant" &&
      typeof message.text === "string" &&
      (message.text.includes("이 질문에 대해 편안하게 답해주세요") ||
        message.text.includes("아기에게 들려주는 편지처럼"))
    ) {
      promptIndex = index;
      break;
    }
  }
  const reflectionMessages =
    promptIndex >= 0 ? messages.slice(promptIndex + 1) : messages;

  return reflectionMessages.filter((message) => message.role === "user")
    .length;
}

export function resolveLetterReflectionCurrentTurnCount(input: {
  priorQuestionId?: string | null;
  priorTurnCount?: number | null;
  nextQuestionId?: string | null;
  recentMessages?: LetterReflectionRecentMessage[] | null;
}) {
  const nextQuestionId = input.nextQuestionId ?? null;
  const priorTurnCount =
    typeof input.priorTurnCount === "number" &&
    Number.isFinite(input.priorTurnCount)
      ? Math.max(0, Math.floor(input.priorTurnCount))
      : 0;

  if (
    nextQuestionId &&
    input.priorQuestionId === nextQuestionId &&
    priorTurnCount > 0
  ) {
    return priorTurnCount + 1;
  }

  const recentUserTurns = countUserTurnsFromRecentMessages(
    input.recentMessages,
  );
  return Math.max(recentUserTurns, nextQuestionId ? 1 : 0);
}

function wrapUpRepeatingQuestion(answer: unknown, wrapUpMessage: string) {
  if (typeof answer !== "string" || !answer.trim()) {
    return wrapUpMessage;
  }

  const answerBeforeWrapUp = answer.includes(wrapUpMessage)
    ? answer.slice(0, answer.indexOf(wrapUpMessage)).trim()
    : answer.trim();
  const answerWithoutTrailingQuestion = answerBeforeWrapUp
    .replace(
      /(^|\s+)[^.!?。！？\n]*[?？]\s*[*_`"'”’)\]]*\s*$/u,
      "",
    )
    .trim();

  return answerWithoutTrailingQuestion
    ? `${answerWithoutTrailingQuestion}\n\n${wrapUpMessage}`
    : wrapUpMessage;
}

function transitionToFreeChat(
  payload: LetterReflectionPayload,
  answeredIds: string[],
  answerText: string,
) {
  delete payload.quickReplies;
  payload.scenario = "general";
  payload.answer = answerText;
  payload.nextSessionMemory = {
    ...(payload.nextSessionMemory ?? {}),
    workflowVersion: 2,
    stage: "free_chat",
    stageName: "free_chat",
    compactSummary: "현재 단계: 자유 대화",
    lastScenario: "general",
    lastCharacterTone:
      typeof payload.nextSessionMemory?.lastCharacterTone === "string"
        ? payload.nextSessionMemory.lastCharacterTone
        : "calm",
    answeredQuestionIds: answeredIds,
    currentAttachmentQuestionId: null,
  };
}

function preserveReflectionProgress(
  payload: LetterReflectionPayload,
  progress: {
    answeredQuestionIds: string[];
    currentAttachmentQuestionId: string | null;
  },
  turnCount: number,
) {
  if (!progress.currentAttachmentQuestionId) {
    return;
  }

  const existing = payload.nextSessionMemory ?? {};
  payload.nextSessionMemory = {
    ...existing,
    workflowVersion: 2,
    stage: 2,
    stageName: "choice_conversation",
    compactSummary:
      typeof existing.compactSummary === "string" &&
      existing.compactSummary.trim()
        ? existing.compactSummary
        : "현재 단계: 질문 답변 중",
    lastScenario:
      payload.scenario ??
      (typeof existing.lastScenario === "string"
        ? existing.lastScenario
        : "letter_reflection"),
    answeredQuestionIds: progress.answeredQuestionIds,
    currentAttachmentQuestionId: progress.currentAttachmentQuestionId,
    currentQuestionTurnCount: turnCount,
  };
}

export function syncLetterReflectionPayloadToMessageParts(
  message: AssistantMessageLike,
  payload: LetterReflectionPayload,
) {
  const answer = typeof payload.answer === "string" ? payload.answer.trim() : "";
  if (answer) {
    const textIndex = message.parts.findIndex((part) => part.type === "text");
    const existingText =
      textIndex >= 0 ? message.parts[textIndex] : undefined;
    const nextTextPart = {
      ...(existingText ?? {}),
      type: "text",
      id:
        typeof existingText?.id === "string"
          ? existingText.id
          : `workflow-text-${Date.now()}`,
      text: answer,
    };
    if (textIndex >= 0) {
      message.parts[textIndex] = nextTextPart;
    } else {
      message.parts = [nextTextPart, ...message.parts];
    }
  }

  const quickReplies = Array.isArray(payload.quickReplies)
    ? payload.quickReplies
    : [];
  const baseId = `workflow-quick-${Date.now()}`;
  const choices = quickReplies
    .map((choice, index) => {
      const label = typeof choice.label === "string" ? choice.label.trim() : "";
      const messageText =
        typeof choice.message === "string" && choice.message.trim()
          ? choice.message.trim()
          : label;
      return label
        ? {
            id:
              typeof choice.id === "string" && choice.id.trim()
                ? choice.id.trim()
                : `${baseId}-choice-${index + 1}`,
            label,
            message: messageText,
          }
        : null;
    })
    .filter(
      (
        choice,
      ): choice is {
        id: string;
        label: string;
        message: string;
      } => Boolean(choice),
    );

  if (choices.length > 0) {
    message.parts = [
      ...message.parts.filter((part) => part.type !== "quickReplies"),
      {
        type: "quickReplies",
        id: baseId,
        choices,
      },
    ];
    return;
  }

  message.parts = message.parts.filter((part) => part.type !== "quickReplies");
}

export function rewriteLetterReflectionQuickReplies(
  payload: LetterReflectionPayload,
  progress: {
    answeredQuestionIds: string[];
    currentAttachmentQuestionId: string | null;
    /** 같은 currentAttachmentQuestionId 로 이어진 letter_reflection turn 수(이번 턴 포함) */
    currentQuestionTurnCount?: number;
  },
  options: {
    mode?: LetterReflectionQuickReplyMode;
    loopPolicy?: unknown;
    quota?: number;
    candidateQuestionIds?: string[];
  } = {},
): LetterReflectionPayload {
  if (!payload) return payload;
  const loopPolicy = normalizeLetterReflectionLoopPolicy(options.loopPolicy);
  const quota = options.quota ?? 3;
  const mode = options.mode ?? loopPolicy.quickReplyMode;
  const current = progress.currentAttachmentQuestionId;
  const answeredIdsAfterClose =
    current && !progress.answeredQuestionIds.includes(current)
      ? [...progress.answeredQuestionIds, current]
      : progress.answeredQuestionIds;
  const answeredAfterClose = answeredIdsAfterClose.length;
  const candidateQuestionIds = options.candidateQuestionIds ?? [];
  const remainingAfterClose =
    candidateQuestionIds.length > 0
      ? candidateQuestionIds.filter((id) => !answeredIdsAfterClose.includes(id))
          .length
      : Math.max(0, quota - answeredAfterClose);

  if (remainingAfterClose === 0) {
    transitionToFreeChat(
      payload,
      answeredIdsAfterClose,
      loopPolicy.exhaustedFreeChatMessage,
    );
    return payload;
  }

  const turnCount = progress.currentQuestionTurnCount ?? 0;
  const nextChipMinTurns = resolveLetterReflectionNextChipMinTurns(
    current,
    loopPolicy,
  );
  const allowNextChip =
    turnCount >= nextChipMinTurns ||
    turnCount >= loopPolicy.maxUserTurnsPerQuestion;

  preserveReflectionProgress(payload, progress, turnCount);

  if (!allowNextChip && mode === "hidden") {
    delete payload.quickReplies;
    return payload;
  }

  const existingReplies: QuickReply[] = Array.isArray(payload.quickReplies)
    ? (payload.quickReplies as QuickReply[])
    : [];

  const assistiveButtons: QuickReply[] =
    mode === "assistive"
      ? [
          existingReplies.find(
            (q) => q.message === "하나 더 이야기하고 싶어요.",
          ) ?? {
            id: "continue",
            label: "조금 더 이야기할래요",
            message: "하나 더 이야기하고 싶어요.",
          },
          existingReplies.find(
            (q) => q.message === "다른 방향으로 물어봐주세요.",
          ) ?? {
            id: "reframe",
            label: "다른 쪽으로 물어봐줘요",
            message: "다른 방향으로 물어봐주세요.",
          },
        ]
      : [];

  const nextButton = {
    id: "next",
    label: loopPolicy.nextQuestionLabelTemplate.replace(
      /\{\{\s*remainingCount\s*\}\}/g,
      String(remainingAfterClose),
    ),
    message: loopPolicy.nextQuestionMessage,
  };

  const existingNext = existingReplies.find((q) =>
    /다른 질문|질문 살펴|다음 질문|자유대화|여기까지/.test(q.label),
  );

  if (allowNextChip) {
    payload.answer = wrapUpRepeatingQuestion(
      payload.answer,
      loopPolicy.wrapUpMessage,
    );
  }

  payload.quickReplies = [
    ...assistiveButtons,
    ...(allowNextChip
      ? [
          existingNext && remainingAfterClose > 0
            ? {
                ...existingNext,
                id: existingNext.id ?? "next",
                label: nextButton.label,
                message: nextButton.message,
              }
            : nextButton,
        ]
      : []),
  ];
  return payload;
}
