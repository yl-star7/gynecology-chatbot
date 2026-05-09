import type { DailyQuestionSummary } from "@gynecology-chatbot/app-core";
import {
  isQuestionAnswerText,
  isQuestionSummaryPendingText,
  isUsableQuestionAnswerSummary,
} from "./chat/question-summary";

export type RecordDayQuestionRow = {
  id: string;
  question_text: string;
  day_number: number | null;
};

export type RecordDayQuestionRecordRow = {
  title: string;
  summary: string | null;
  entry_type: string;
  session_id?: string | null;
  payload: {
    source?: string;
    questionId?: string;
    question?: string;
    answer?: string;
    compactSummary?: string | null;
    assistantSummary?: string | null;
  } | null;
};

export const QUESTION_WAITING_COPY = "답변을 기다리고 있어요.";
export const QUESTION_SUMMARY_PREPARING_COPY =
  "답변 요약을 준비하고 있어요.";
const SESSION_QUESTION_GROUP_PREFIX = "session-question-group:";

function mergeQuestionRows(
  datedQuestionRows: RecordDayQuestionRow[],
  genericQuestionRows: RecordDayQuestionRow[],
) {
  const questionsById = new Map<string, RecordDayQuestionRow>();

  for (const question of [...datedQuestionRows, ...genericQuestionRows]) {
    if (!questionsById.has(question.id)) {
      questionsById.set(question.id, question);
    }
  }

  return [...questionsById.values()];
}

function findQuestionAnswerSummary(
  records: RecordDayQuestionRecordRow[],
  question: RecordDayQuestionRow,
) {
  const questionSummary = records.find(
    (record) =>
      record.entry_type === "question_summary" &&
      (record.payload?.questionId === question.id ||
        record.payload?.question === question.question_text ||
        record.title === question.question_text),
  );
  if (questionSummary?.summary) {
    const storedAnswer = resolveStoredQuestionAnswer(
      questionSummary.payload?.answer,
      question,
    );
    const summaryText =
      questionSummary.payload?.compactSummary ?? questionSummary.summary;
    const isUnfinalized =
      questionSummary.payload?.source === "attachment_question_followup" ||
      isQuestionSummaryPendingText(summaryText) ||
      isQuestionSummaryPendingText(questionSummary.summary);
    if (
      !isUnfinalized &&
      isUsableQuestionAnswerSummary({
        summary: questionSummary.summary,
        answer: storedAnswer,
      })
    ) {
      return questionSummary.summary;
    }
    if (storedAnswer) return QUESTION_SUMMARY_PREPARING_COPY;
  }

  const surveyResponse = records.find(
    (record) =>
      record.entry_type === "survey_response" &&
      (record.payload?.questionId === question.id ||
        record.title === question.question_text),
  );

  const surveyAnswer = resolveStoredQuestionAnswer(
    surveyResponse?.payload?.answer ?? surveyResponse?.summary,
    question,
  );
  return surveyAnswer ? QUESTION_SUMMARY_PREPARING_COPY : null;
}

function normalizeQuestionAnswer(text: string | null | undefined) {
  return text?.replace(/\s+/g, " ").trim() ?? "";
}

function resolveStoredQuestionAnswer(
  answer: string | null | undefined,
  question: RecordDayQuestionRow,
) {
  const normalized = normalizeQuestionAnswer(answer);
  if (
    !isQuestionAnswerText({
      userAnswer: normalized,
      questionText: question.question_text,
    })
  ) {
    return null;
  }

  return normalized;
}

function includesNormalizedText(
  haystack: string | null | undefined,
  needle: string,
) {
  const normalizedHaystack = normalizeQuestionAnswer(haystack);
  const normalizedNeedle = normalizeQuestionAnswer(needle);

  return (
    normalizedNeedle.length > 0 && normalizedHaystack.includes(normalizedNeedle)
  );
}

function findAskedQuestionStatus(
  records: RecordDayQuestionRecordRow[],
  question: RecordDayQuestionRow,
) {
  const questionText = question.question_text;
  const pendingQuestionSummary = records.find(
    (record) =>
      record.entry_type === "question_summary" &&
      (record.payload?.questionId === question.id ||
        record.payload?.question === questionText ||
        record.title === questionText) &&
      isQuestionSummaryPendingText(
        record.payload?.compactSummary ?? record.summary,
      ),
  );
  if (pendingQuestionSummary) {
    return QUESTION_WAITING_COPY;
  }

  const pendingChat = records.find(
    (record) =>
      record.entry_type === "chat_saved" &&
      (includesNormalizedText(record.title, questionText) ||
        includesNormalizedText(record.payload?.question, questionText) ||
        includesNormalizedText(record.payload?.assistantSummary, questionText)),
  );

  return pendingChat ? QUESTION_WAITING_COPY : null;
}

export function buildDailyQuestionSummaries(input: {
  datedQuestionRows: RecordDayQuestionRow[];
  genericQuestionRows: RecordDayQuestionRow[];
  records: RecordDayQuestionRecordRow[];
  /** @deprecated pending summaries now resolve to a concrete answer or null. */
  deferUnfinalizedToToday?: boolean;
}): DailyQuestionSummary[] {
  return mergeQuestionRows(
    input.datedQuestionRows,
    input.genericQuestionRows,
  ).map((question) => ({
    id: question.id,
    question: question.question_text,
    answerSummary: resolveQuestionAnswerDisplay(input.records, question),
  }));
}

export function resolveQuestionAnswerDisplay(
  records: RecordDayQuestionRecordRow[],
  question: RecordDayQuestionRow,
) {
  return (
    findQuestionAnswerSummary(records, question) ??
    findAskedQuestionStatus(records, question)
  );
}

function resolveQuestionSessionId(
  records: RecordDayQuestionRecordRow[],
  questionId: string,
) {
  const record = records.find(
    (item) =>
      item.entry_type === "question_summary" &&
      item.payload?.questionId === questionId &&
      item.session_id,
  );

  return record?.session_id ?? null;
}

function isAnsweredQuestionSummary(item: DailyQuestionSummary) {
  return Boolean(
    item.answerSummary &&
      item.answerSummary !== QUESTION_WAITING_COPY &&
      item.answerSummary !== QUESTION_SUMMARY_PREPARING_COPY,
  );
}

function buildSessionQuestionSummary(items: DailyQuestionSummary[]) {
  return items
    .map((item, index) => `${index + 1}. ${item.answerSummary}`)
    .join("\n");
}

export function groupDailyQuestionSummariesBySession(input: {
  dailyQuestions: DailyQuestionSummary[];
  records: RecordDayQuestionRecordRow[];
}): DailyQuestionSummary[] {
  const groupableSessionIds = new Map<string, number>();

  for (const question of input.dailyQuestions) {
    if (!isAnsweredQuestionSummary(question)) continue;

    const sessionId = resolveQuestionSessionId(input.records, question.id);
    if (!sessionId) continue;

    groupableSessionIds.set(
      sessionId,
      (groupableSessionIds.get(sessionId) ?? 0) + 1,
    );
  }

  const groupedSessionIds = new Set(
    [...groupableSessionIds.entries()]
      .filter(([, count]) => count > 1)
      .map(([sessionId]) => sessionId),
  );

  if (groupedSessionIds.size === 0) {
    return input.dailyQuestions;
  }

  const sessionItems = new Map<string, DailyQuestionSummary[]>();
  const result: DailyQuestionSummary[] = [];

  for (const question of input.dailyQuestions) {
    const sessionId = isAnsweredQuestionSummary(question)
      ? resolveQuestionSessionId(input.records, question.id)
      : null;

    if (!sessionId || !groupedSessionIds.has(sessionId)) {
      result.push(question);
      continue;
    }

    const items = sessionItems.get(sessionId) ?? [];
    items.push(question);
    sessionItems.set(sessionId, items);

    if (items.length === 1) {
      result.push({
        id: `${SESSION_QUESTION_GROUP_PREFIX}${sessionId}`,
        question: "오늘 나눈 질문들",
        answerSummary: "",
      });
    }
  }

  return result.map((item) => {
    if (!item.id.startsWith(SESSION_QUESTION_GROUP_PREFIX)) return item;

    const sessionId = item.id.slice(SESSION_QUESTION_GROUP_PREFIX.length);
    const items = sessionItems.get(sessionId) ?? [];
    return {
      ...item,
      question: `오늘 나눈 질문 ${items.length}개`,
      answerSummary: buildSessionQuestionSummary(items),
    };
  });
}
