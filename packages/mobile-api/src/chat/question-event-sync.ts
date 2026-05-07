/**
 * user_question_events 테이블 INSERT/UPDATE helper.
 *
 * - recordQuestionSent: stage=1 -> stage=2 전환 (사용자가 질문 선택) 시 호출.
 * - markQuestionAnswered: stage=2 답변 턴에서 answer_text + answered_at 기록.
 * - markQuestionSkipped: 질문을 미루고 자유대화로 이동할 때 호출.
 */

import { dbInsert, dbSelect, dbUpdate } from "../db/admin-client";

function eq(value: string) {
  return encodeURIComponent(value);
}

type QuestionEventIdRow = {
  id: string;
};

async function loadOpenQuestionEventIds(input: {
  userId: string;
  sessionId: string | null;
  questionId: string;
}) {
  const sessionFilter = input.sessionId
    ? `&session_id=eq.${eq(input.sessionId)}`
    : "&session_id=is.null";
  return dbSelect<QuestionEventIdRow[]>(
    [
      "user_question_events?select=id",
      `user_id=eq.${eq(input.userId)}`,
      `question_id=eq.${eq(input.questionId)}`,
      sessionFilter.replace(/^&/, ""),
      "status=eq.sent",
      "answered_at=is.null",
      "order=updated_at.desc",
    ].join("&"),
  );
}

export async function recordQuestionSent(input: {
  userId: string;
  sessionId: string | null;
  questionId: string;
  promptMessageId?: string | null;
}): Promise<void> {
  const existing = await loadOpenQuestionEventIds(input);
  if (existing.length > 0) return;

  await dbInsert("user_question_events", {
    user_id: input.userId,
    question_id: input.questionId,
    session_id: input.sessionId,
    prompt_message_id: input.promptMessageId ?? null,
    status: "sent",
    sent_at: new Date().toISOString(),
  });
}

export async function markQuestionAnswered(input: {
  userId: string;
  sessionId: string | null;
  questionId: string;
  answerText: string;
  answerMessageId?: string | null;
}): Promise<number> {
  const rows = await loadOpenQuestionEventIds(input);
  const now = new Date().toISOString();

  for (const row of rows) {
    await dbUpdate(`user_question_events?id=eq.${eq(row.id)}`, {
      status: "answered",
      answered_at: now,
      answer_text: input.answerText.slice(0, 2000),
      ...(input.answerMessageId
        ? { answer_message_id: input.answerMessageId }
        : {}),
      updated_at: now,
    });
  }

  return rows.length;
}

export async function markQuestionSkipped(input: {
  userId: string;
  sessionId: string | null;
  questionId: string;
  reasonText: string;
}): Promise<number> {
  const rows = await loadOpenQuestionEventIds(input);
  const now = new Date().toISOString();

  for (const row of rows) {
    await dbUpdate(`user_question_events?id=eq.${eq(row.id)}`, {
      status: "skipped",
      answer_text: input.reasonText.slice(0, 2000),
      updated_at: now,
    });
  }

  return rows.length;
}
