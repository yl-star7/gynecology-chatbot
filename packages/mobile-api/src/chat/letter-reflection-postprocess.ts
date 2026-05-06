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

export const LETTER_REFLECTION_NEXT_CHIP_MIN_TURNS_MIN = 2;
export const LETTER_REFLECTION_NEXT_CHIP_MIN_TURNS_MAX = 2;
export const QUESTION_EXHAUSTED_FREE_CHAT_MESSAGE =
  "오늘의 질문을 모두 답변하셨어요. 이제 자유롭게 얘기해보아요.";
export const QUESTION_WRAP_UP_MESSAGE =
  "오늘 질문은 여기까지 담아도 충분해요. 이 마음을 기억해둘게요.";

type AssistantMessagePartLike = {
  type: string;
  id?: unknown;
  text?: unknown;
  choices?: unknown;
};

type AssistantMessageLike = {
  parts: AssistantMessagePartLike[];
};

export function resolveLetterReflectionNextChipMinTurns(
  currentAttachmentQuestionId: string | null,
) {
  if (!currentAttachmentQuestionId) {
    return LETTER_REFLECTION_NEXT_CHIP_MIN_TURNS_MAX;
  }

  return LETTER_REFLECTION_NEXT_CHIP_MIN_TURNS_MIN;
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

function wrapUpRepeatingQuestion(answer: unknown) {
  if (typeof answer !== "string" || !answer.trim()) {
    return QUESTION_WRAP_UP_MESSAGE;
  }

  const sentences =
    answer
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? [];
  const lastSentence = sentences.at(-1) ?? "";
  const answerWithoutTrailingQuestion = lastSentence.endsWith("?")
    ? sentences.slice(0, -1).join(" ").trim()
    : answer.trim();

  if (answerWithoutTrailingQuestion.includes(QUESTION_WRAP_UP_MESSAGE)) {
    return answerWithoutTrailingQuestion;
  }

  return answerWithoutTrailingQuestion
    ? `${answerWithoutTrailingQuestion}\n\n${QUESTION_WRAP_UP_MESSAGE}`
    : QUESTION_WRAP_UP_MESSAGE;
}

function transitionToFreeChat(
  payload: LetterReflectionPayload,
  answeredIds: string[],
) {
  delete payload.quickReplies;
  payload.scenario = "general";
  payload.answer = QUESTION_EXHAUSTED_FREE_CHAT_MESSAGE;
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
    quota?: number;
    candidateQuestionIds?: string[];
  } = {},
): LetterReflectionPayload {
  if (!payload) return payload;
  const quota = options.quota ?? 3;
  const mode = options.mode ?? "hidden";
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
    transitionToFreeChat(payload, answeredIdsAfterClose);
    return payload;
  }

  const turnCount = progress.currentQuestionTurnCount ?? 0;
  const nextChipMinTurns = resolveLetterReflectionNextChipMinTurns(current);
  const allowNextChip = turnCount >= nextChipMinTurns;

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
    label: `다른 질문도 볼래요 (${remainingAfterClose}개)`,
    message: "다음 질문으로 이어갈래요.",
  };

  const existingNext = existingReplies.find((q) =>
    /다른 질문|질문 살펴|다음 질문|자유대화|여기까지/.test(q.label),
  );

  if (allowNextChip) {
    payload.answer = wrapUpRepeatingQuestion(payload.answer);
  }

  payload.quickReplies = [
    ...assistiveButtons,
    ...(allowNextChip
      ? [
          existingNext && remainingAfterClose > 0
            ? {
                ...existingNext,
                id: existingNext.id ?? "next",
                label: `다른 질문도 볼래요 (${remainingAfterClose}개)`,
                message: "다음 질문으로 이어갈래요.",
              }
            : nextButton,
        ]
      : []),
  ];
  return payload;
}
