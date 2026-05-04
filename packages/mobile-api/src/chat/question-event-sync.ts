/**
 * user_question_events 테이블 INSERT/UPDATE helper.
 *
 * - recordQuestionSent: stage=1 → stage=2 전환 (사용자가 질문 선택) 시 호출.
 * - markQuestionAnswered: stage=2 closing 에서 호출. answer_text + answered_at 기록.
 * - markQuestionSkipped: 질문을 미루고 자유대화로 이동할 때 호출.
 *
 * fire-and-forget 로 호출 가능 (throw 시 warn 만).
 */

type PrismaLike = {
  user_question_events: {
    findFirst: (args: {
      where: Record<string, unknown>;
      orderBy?: Record<string, "asc" | "desc">;
      select?: Record<string, true>;
    }) => Promise<{ id: string } | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
};

export async function recordQuestionSent(input: {
  prisma: PrismaLike;
  userId: string;
  sessionId: string | null;
  questionId: string;
  promptMessageId?: string | null;
}): Promise<void> {
  // 같은 session + question 으로 이미 sent 레코드 있으면 skip (중복 방지)
  const existing = await input.prisma.user_question_events.findFirst({
    where: {
      user_id: input.userId,
      question_id: input.questionId,
      session_id: input.sessionId ?? null,
      status: "sent",
      answered_at: null,
    },
    select: { id: true },
  });
  if (existing) return;

  await input.prisma.user_question_events.create({
    data: {
      user_id: input.userId,
      question_id: input.questionId,
      session_id: input.sessionId,
      prompt_message_id: input.promptMessageId ?? null,
      status: "sent",
      sent_at: new Date(),
    },
  });
}

export async function markQuestionAnswered(input: {
  prisma: PrismaLike;
  userId: string;
  sessionId: string | null;
  questionId: string;
  answerText: string;
  answerMessageId?: string | null;
}): Promise<number> {
  const result = await input.prisma.user_question_events.updateMany({
    where: {
      user_id: input.userId,
      question_id: input.questionId,
      session_id: input.sessionId ?? null,
      status: "sent",
      answered_at: null,
    },
    data: {
      status: "answered",
      answered_at: new Date(),
      answer_text: input.answerText.slice(0, 2000),
      answer_message_id: input.answerMessageId ?? undefined,
      updated_at: new Date(),
    },
  });
  return result.count;
}

export async function markQuestionSkipped(input: {
  prisma: PrismaLike;
  userId: string;
  sessionId: string | null;
  questionId: string;
  reasonText: string;
}): Promise<number> {
  const result = await input.prisma.user_question_events.updateMany({
    where: {
      user_id: input.userId,
      question_id: input.questionId,
      session_id: input.sessionId ?? null,
      status: "sent",
      answered_at: null,
    },
    data: {
      status: "skipped",
      answer_text: input.reasonText.slice(0, 2000),
      updated_at: new Date(),
    },
  });
  return result.count;
}
