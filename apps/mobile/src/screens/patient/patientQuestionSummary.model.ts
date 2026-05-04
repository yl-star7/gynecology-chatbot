const PENDING_QUESTION_SUMMARY_PATTERN =
  /오늘의 질문 준비|질문 답변 대기|질문 답변 중|질문 답변 종료 신호|자정에 요약이 준비|요약이 준비됩니다/;

export const QUESTION_ANSWER_EMPTY_COPY = "아직 답변하지 않았어요.";

function normalizeQuestionSummary(text: string | null | undefined) {
  return (
    text
      ?.replace(/^현재 단계:\s*/u, "")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

export function isPendingQuestionAnswerSummary(
  text: string | null | undefined,
) {
  return PENDING_QUESTION_SUMMARY_PATTERN.test(normalizeQuestionSummary(text));
}

export function resolveQuestionAnswerSummary(
  answerSummary: string | null | undefined,
) {
  const normalized = normalizeQuestionSummary(answerSummary);
  if (!normalized || isPendingQuestionAnswerSummary(normalized)) {
    return null;
  }

  return normalized;
}

export function formatQuestionAnswerSummary(
  answerSummary: string | null | undefined,
) {
  return (
    resolveQuestionAnswerSummary(answerSummary) ?? QUESTION_ANSWER_EMPTY_COPY
  );
}
