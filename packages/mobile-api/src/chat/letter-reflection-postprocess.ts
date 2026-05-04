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

/**
 * 같은 attachment 질문에 대해 letter_reflection turn 이 몇 번 이어졌는지 임계값.
 * 이 값 미만이면 "다른 질문도 볼래요" chip 을 노출하지 않는다.
 */
export const LETTER_REFLECTION_NEXT_CHIP_MIN_TURNS = 3;
export const QUESTION_EXHAUSTED_FREE_CHAT_MESSAGE =
  "오늘의 질문을 모두 답변하셨어요. 이제 자유롭게 얘기해보아요.";

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
  } = {},
): LetterReflectionPayload {
  if (!payload) return payload;
  const quota = options.quota ?? 3;
  const mode = options.mode ?? "hidden";
  const current = progress.currentAttachmentQuestionId;
  // 이 질문이 종결되면 answered 에 더해지므로 "종결 후" 남은 개수 기준
  const answeredAfterClose =
    current && !progress.answeredQuestionIds.includes(current)
      ? progress.answeredQuestionIds.length + 1
      : progress.answeredQuestionIds.length;
  const remainingAfterClose = Math.max(0, quota - answeredAfterClose);
  const answeredIdsAfterClose =
    current && !progress.answeredQuestionIds.includes(current)
      ? [...progress.answeredQuestionIds, current]
      : progress.answeredQuestionIds;

  if (remainingAfterClose === 0) {
    transitionToFreeChat(payload, answeredIdsAfterClose);
    return payload;
  }

  const turnCount = progress.currentQuestionTurnCount ?? 0;
  const allowNextChip = turnCount >= LETTER_REFLECTION_NEXT_CHIP_MIN_TURNS;

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
