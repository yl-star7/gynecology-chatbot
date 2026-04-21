import type { DailyQuestionSummary } from "@gynecology-chatbot/app-core";

export type RecordDayQuestionRow = {
  id: string;
  question_text: string;
  day_number: number | null;
};

export type RecordDayQuestionRecordRow = {
  title: string;
  summary: string | null;
  entry_type: string;
  payload: {
    questionId?: string;
    question?: string;
    answer?: string;
  } | null;
};

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
    return questionSummary.summary;
  }

  const surveyResponse = records.find(
    (record) =>
      record.entry_type === "survey_response" &&
      (record.payload?.questionId === question.id ||
        record.title === question.question_text),
  );

  return surveyResponse?.summary ?? surveyResponse?.payload?.answer ?? null;
}

export function buildDailyQuestionSummaries(input: {
  datedQuestionRows: RecordDayQuestionRow[];
  genericQuestionRows: RecordDayQuestionRow[];
  records: RecordDayQuestionRecordRow[];
}): DailyQuestionSummary[] {
  return mergeQuestionRows(
    input.datedQuestionRows,
    input.genericQuestionRows,
  ).map((question) => ({
    id: question.id,
    question: question.question_text,
    answerSummary: findQuestionAnswerSummary(input.records, question),
  }));
}
