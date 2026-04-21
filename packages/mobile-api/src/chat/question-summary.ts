/**
 * stage=2 에서 오늘의 질문에 대한 사용자 응답 + AI 답변을 요약해 calendar_logs 에 저장.
 * entry_type="question_summary", 기존 "chat_saved" 와 분리된 daily 기록 엔트리.
 *
 * 호출: 서버 chat 라우트에서 stage=2 LLM 턴 완료 후 fire-and-forget.
 */

export type QuestionSummaryInput = {
  userId: string;
  sessionId: string | null;
  dateKey: string; // "YYYY-MM-DD" KST
  questionId: string;
  questionText: string | null;
  userAnswer: string; // 사용자의 원문
  assistantAnswer: string; // AI 응답 본문 (요약 전)
  compactSummary: string | null;
  emotionTone: string | null;
  moodId: string | null;
  moodLabel: string | null;
};

export type QuestionSummaryRecord = {
  userId: string;
  sessionId: string | null;
  date: string;
  entryType: "question_summary";
  title: string;
  summary: string;
  payload: {
    questionId: string;
    question: string | null;
    answer: string;
    aiResponse: string;
    compactSummary: string | null;
    emotionTone: string | null;
    moodId: string | null;
    moodLabel: string | null;
    source: "attachment_question_followup";
    createdAt: string;
  };
};

/**
 * 요약 문자열 생성 — compactSummary 우선, 없으면 사용자 답변 앞머리 사용.
 * LLM 재호출 없이 즉시 생성 (latency 0ms).
 */
export function buildSummaryText(
  input: Pick<QuestionSummaryInput, "compactSummary" | "userAnswer">,
): string {
  const compact = input.compactSummary?.replace(/^현재 단계:\s*/u, "").trim();
  if (compact && compact.length >= 10) return compact.slice(0, 220);
  return input.userAnswer.replace(/\s+/g, " ").trim().slice(0, 220);
}

/**
 * 제목 = 질문 앞머리 or fallback.
 */
export function buildTitle(
  questionText: string | null,
  fallback = "오늘의 질문",
): string {
  if (!questionText) return fallback;
  const trimmed = questionText.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed.slice(0, 40) : fallback;
}

/**
 * DB 저장용 record 생성 (pure).
 * 실제 저장은 호출 측에서 prisma.calendar_logs.create() 로.
 */
export function buildQuestionSummaryRecord(
  input: QuestionSummaryInput,
): QuestionSummaryRecord {
  return {
    userId: input.userId,
    sessionId: input.sessionId,
    date: input.dateKey,
    entryType: "question_summary",
    title: buildTitle(input.questionText),
    summary: buildSummaryText({
      compactSummary: input.compactSummary,
      userAnswer: input.userAnswer,
    }),
    payload: {
      questionId: input.questionId,
      question: input.questionText,
      answer: input.userAnswer.replace(/\s+/g, " ").trim().slice(0, 1000),
      aiResponse: input.assistantAnswer
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 1200),
      compactSummary: input.compactSummary,
      emotionTone: input.emotionTone,
      moodId: input.moodId,
      moodLabel: input.moodLabel,
      source: "attachment_question_followup",
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * stage=2 턴에서 선택된 질문 ID가 존재하고, 해당 질문이 처음으로 요약 저장되는지 판별.
 * 이미 같은 date/session/questionId 로 저장된 기록이 있으면 skip (중복 방지).
 */
export function shouldSaveQuestionSummary(input: {
  workflowStage: unknown;
  selectedQuestionId: string | null;
  alreadyPersistedQuestionIds: Set<string>;
}): boolean {
  if (input.workflowStage !== 2 && input.workflowStage !== "2") return false;
  if (!input.selectedQuestionId) return false;
  if (input.alreadyPersistedQuestionIds.has(input.selectedQuestionId))
    return false;
  return true;
}
