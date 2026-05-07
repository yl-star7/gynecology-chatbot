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
import { dbSelect } from "../db/admin-client";

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

function eq(value: string) {
  return encodeURIComponent(value);
}

/**
 * DB 조회 wrapper.
 */
export async function fetchAttachmentQuestionProgress(deps: {
  userId: string;
  sessionId: string | null;
  now?: Date;
}): Promise<QuestionProgress> {
  const dayStartUtc = getKstDayStartUtc(deps.now);
  const answeredPath = [
    "user_question_events?select=question_id,status,sent_at,answered_at",
    `user_id=eq.${eq(deps.userId)}`,
    "status=eq.answered",
    `answered_at=gte.${eq(dayStartUtc.toISOString())}`,
    "order=sent_at.desc",
  ].join("&");
  const sentPath = deps.sessionId
    ? [
        "user_question_events?select=question_id,status,sent_at,answered_at",
        `user_id=eq.${eq(deps.userId)}`,
        `session_id=eq.${eq(deps.sessionId)}`,
        "status=eq.sent",
        "answered_at=is.null",
        "order=sent_at.desc",
      ].join("&")
    : null;
  const [answeredRows, sentRows] = await Promise.all([
    dbSelect<QuestionEventRow[]>(answeredPath),
    sentPath ? dbSelect<QuestionEventRow[]>(sentPath) : Promise.resolve([]),
  ]);

  return computeProgressFromEvents({
    rows: [...answeredRows, ...sentRows],
    sessionId: deps.sessionId,
    dayStartUtc,
  });
}
