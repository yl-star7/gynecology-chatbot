/**
 * letter_reflection subworkflow 응답 후처리.
 *
 * - quickReplies 의 "다른 질문 살펴볼래요" 라벨에 **남은 질문 개수** 표시
 *   예: "다른 질문 살펴볼래요 (2개)"
 * - 남은 질문이 0개면 라벨을 "자유대화로" 로 대체 (stage 자동 전환)
 * - "조금 더 말할래요" 라벨은 그대로 유지
 *
 * 입력: LLM 이 반환한 parsed JSON payload + 현재 진행 상태
 * 출력: 수정된 payload (in-place 가능, 반환도 함)
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

export function rewriteLetterReflectionQuickReplies(
  payload: LetterReflectionPayload,
  progress: {
    answeredQuestionIds: string[];
    currentAttachmentQuestionId: string | null;
  },
  quota = 3,
): LetterReflectionPayload {
  if (!payload) return payload;
  const current = progress.currentAttachmentQuestionId;
  // 이 질문이 종결되면 answered 에 더해지므로 "종결 후" 남은 개수 기준
  const answeredAfterClose =
    current && !progress.answeredQuestionIds.includes(current)
      ? progress.answeredQuestionIds.length + 1
      : progress.answeredQuestionIds.length;
  const remainingAfterClose = Math.max(0, quota - answeredAfterClose);

  const qr: QuickReply[] = Array.isArray(payload.quickReplies)
    ? (payload.quickReplies as QuickReply[])
    : [];

  // 기본 3개 quickReplies 강제 (LLM 이 누락해도 서버가 채움)
  const hasContinue = qr.some((q) => q.message === "하나 더 이야기하고 싶어요.");
  const hasReframe = qr.some((q) => q.message === "다른 방향으로 물어봐주세요.");
  const hasNext = qr.some((q) =>
    /다른 질문|질문 살펴|다음 질문|자유대화|여기까지/.test(q.label),
  );

  const ensured: QuickReply[] = [];
  if (hasContinue) {
    ensured.push(qr.find((q) => q.message === "하나 더 이야기하고 싶어요.")!);
  } else {
    ensured.push({
      id: "continue",
      label: "조금 더 이야기할래요",
      message: "하나 더 이야기하고 싶어요.",
    });
  }
  if (hasReframe) {
    ensured.push(qr.find((q) => q.message === "다른 방향으로 물어봐주세요.")!);
  } else {
    ensured.push({
      id: "reframe",
      label: "다른 쪽으로 물어봐줘요",
      message: "다른 방향으로 물어봐주세요.",
    });
  }
  if (hasNext) {
    ensured.push(qr.find((q) => /다른 질문|질문 살펴|다음 질문|자유대화|여기까지/.test(q.label))!);
  } else {
    ensured.push({
      id: "next",
      label: "다른 질문도 볼래요",
      message: "다음 질문으로 이어갈래요.",
    });
  }

  // 다른 질문 라벨에 남은 개수 표시 or "자유대화로" 대체
  const nextIdx = ensured.findIndex((q) =>
    /다른 질문|질문 살펴|다음 질문|자유대화|여기까지/.test(q.label),
  );
  if (nextIdx >= 0) {
    if (remainingAfterClose === 0) {
      ensured[nextIdx] = {
        id: "to-free-chat",
        label: "자유대화로",
        message: "자유롭게 대화하고 싶어요.",
      };
    } else if (/다른 질문|질문 살펴|다음 질문/.test(ensured[nextIdx].label)) {
      ensured[nextIdx] = {
        ...ensured[nextIdx],
        id: ensured[nextIdx].id ?? "next",
        label: `다른 질문도 볼래요 (${remainingAfterClose}개)`,
        message: "다음 질문으로 이어갈래요.",
      };
    }
  }

  payload.quickReplies = ensured;
  return payload;
}
