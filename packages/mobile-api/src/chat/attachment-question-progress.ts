/**
 * user_question_events 테이블에서 attachment_question 진행 상태 조회.
 *
 * 진실 소스:
 *   - answeredQuestionIds: 오늘(KST 기준) status='answered' 인 question_id 들
 *   - currentAttachmentQuestionId: 현 세션에서 status='sent' AND answered_at IS NULL
 *     의 가장 최근 question_id (user 가 선택만 하고 아직 마무리 안 한 질문)
 *
 * 호출: chat route 에서 maybeShortCircuitStaticTurn 전에 1회 조회.
 */

import type { QuestionProgress } from "./stage-shortcut";

export type QuestionEventRow = {
  question_id: string;
  status: string;
  sent_at: string | Date | null;
  answered_at: string | Date | null;
};

/**
 * KST 기준 오늘 00:00 (UTC)
 */
export function getKstDayStartUtc(now = new Date()): Date {
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstMs = now.getTime() + kstOffsetMs;
  const kst = new Date(kstMs);
  const startOfDayKst = Date.UTC(
    kst.getUTCFullYear(),
    kst.getUTCMonth(),
    kst.getUTCDate(),
  );
  return new Date(startOfDayKst - kstOffsetMs);
}

/**
 * Pure: rows 에서 progress 계산.
 * 테스트 가능하도록 순수 함수로 분리.
 */
export function computeProgressFromEvents(input: {
  rows: QuestionEventRow[];
  sessionId: string | null;
  dayStartUtc: Date;
}): QuestionProgress {
  const { rows, sessionId, dayStartUtc } = input;
  const dayStartMs = dayStartUtc.getTime();

  const answered = new Map<string, number>(); // id → answered_at ms (dedupe)
  for (const r of rows) {
    if (r.status !== "answered") continue;
    const t = r.answered_at ? new Date(r.answered_at).getTime() : null;
    if (t === null || t < dayStartMs) continue;
    answered.set(r.question_id, t);
  }

  const sentCandidates = rows
    .filter(
      (r) =>
        r.status === "sent" && !r.answered_at && !answered.has(r.question_id),
    )
    .map((r) => ({
      question_id: r.question_id,
      sent_at_ms: r.sent_at ? new Date(r.sent_at).getTime() : 0,
    }))
    .sort((a, b) => b.sent_at_ms - a.sent_at_ms);

  const currentAttachmentQuestionId = sentCandidates[0]?.question_id ?? null;

  return {
    answeredQuestionIds: Array.from(answered.keys()),
    currentAttachmentQuestionId,
  };
}

function isUuid(value: string | null) {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i,
    ),
  );
}

/**
 * DB 조회 wrapper. Prisma 사용. 호출자는 prisma client 주입.
 */
export async function fetchAttachmentQuestionProgress(deps: {
  prisma: {
    user_question_events: {
      findMany: (args: {
        where: Record<string, unknown>;
        select: Record<string, true>;
        orderBy?: Record<string, "asc" | "desc">;
      }) => Promise<QuestionEventRow[]>;
    };
  };
  userId: string;
  sessionId: string | null;
  now?: Date;
}): Promise<QuestionProgress> {
  const dayStartUtc = getKstDayStartUtc(deps.now);
  if (!isUuid(deps.userId)) {
    return computeProgressFromEvents({
      rows: [],
      sessionId: null,
      dayStartUtc,
    });
  }

  const sessionId = isUuid(deps.sessionId) ? deps.sessionId : null;
  const rows = await deps.prisma.user_question_events.findMany({
    where: {
      user_id: deps.userId,
      OR: [
        // 오늘 answered
        {
          status: "answered",
          answered_at: { gte: dayStartUtc },
        },
        // 현 세션에서 sent but not yet answered
        sessionId
          ? {
              session_id: sessionId,
              status: "sent",
              answered_at: null,
            }
          : { id: "__none__" }, // noop
      ],
    },
    select: {
      question_id: true,
      status: true,
      sent_at: true,
      answered_at: true,
    },
    orderBy: { sent_at: "desc" },
  });
  return computeProgressFromEvents({
    rows,
    sessionId,
    dayStartUtc,
  });
}
