import {
  computeProgressFromEvents,
  fetchAttachmentQuestionProgress,
  getKstDayStartUtc,
  type QuestionEventRow,
} from "./attachment-question-progress";

describe("getKstDayStartUtc", () => {
  it("returns KST midnight as UTC", () => {
    // 2026-04-21 15:30 KST = 2026-04-21 06:30 UTC
    const now = new Date("2026-04-21T06:30:00Z");
    const start = getKstDayStartUtc(now);
    // KST 2026-04-21 00:00 = UTC 2026-04-20 15:00
    expect(start.toISOString()).toBe("2026-04-20T15:00:00.000Z");
  });
});

describe("fetchAttachmentQuestionProgress", () => {
  it("returns empty progress without querying Prisma when local user id is not UUID", async () => {
    const findMany = jest.fn();

    const progress = await fetchAttachmentQuestionProgress({
      prisma: {
        user_question_events: {
          findMany,
        },
      },
      userId: "local-user-demo",
      sessionId: "11111111-1111-4111-8111-111111111111",
      now: new Date("2026-04-21T06:30:00Z"),
    });

    expect(progress).toEqual({
      answeredQuestionIds: [],
      currentAttachmentQuestionId: null,
    });
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("computeProgressFromEvents", () => {
  const today = getKstDayStartUtc(new Date("2026-04-21T06:30:00Z"));
  const todayMid = new Date(today.getTime() + 6 * 60 * 60 * 1000); // 오늘 KST 06:00
  const yesterdayMid = new Date(today.getTime() - 12 * 60 * 60 * 1000);

  it("picks today's answered questions only", () => {
    const rows: QuestionEventRow[] = [
      {
        question_id: "q1",
        status: "answered",
        sent_at: todayMid,
        answered_at: todayMid,
      },
      {
        question_id: "q2",
        status: "answered",
        sent_at: yesterdayMid,
        answered_at: yesterdayMid,
      },
      {
        question_id: "q3",
        status: "answered",
        sent_at: todayMid,
        answered_at: todayMid,
      },
    ];
    const p = computeProgressFromEvents({
      rows,
      sessionId: "s1",
      dayStartUtc: today,
    });
    expect(p.answeredQuestionIds.sort()).toEqual(["q1", "q3"]);
    expect(p.currentAttachmentQuestionId).toBeNull();
  });

  it("identifies current question as latest sent-but-not-answered", () => {
    const rows: QuestionEventRow[] = [
      {
        question_id: "q1",
        status: "answered",
        sent_at: todayMid,
        answered_at: todayMid,
      },
      {
        question_id: "q2",
        status: "sent",
        sent_at: new Date(todayMid.getTime() + 1000 * 60),
        answered_at: null,
      },
      {
        question_id: "q3",
        status: "sent",
        sent_at: new Date(todayMid.getTime() + 2000 * 60),
        answered_at: null,
      },
    ];
    const p = computeProgressFromEvents({
      rows,
      sessionId: "s1",
      dayStartUtc: today,
    });
    expect(p.answeredQuestionIds).toEqual(["q1"]);
    // q3 sent_at 이 더 최근이므로 current
    expect(p.currentAttachmentQuestionId).toBe("q3");
  });

  it("ignores sent events for questions already answered today", () => {
    const rows: QuestionEventRow[] = [
      {
        question_id: "q1",
        status: "sent",
        sent_at: todayMid,
        answered_at: null,
      },
      {
        question_id: "q1",
        status: "answered",
        sent_at: todayMid,
        answered_at: new Date(todayMid.getTime() + 1000),
      },
    ];
    const p = computeProgressFromEvents({
      rows,
      sessionId: "s1",
      dayStartUtc: today,
    });
    expect(p.answeredQuestionIds).toEqual(["q1"]);
    expect(p.currentAttachmentQuestionId).toBeNull();
  });

  it("returns empty progress when no events", () => {
    const p = computeProgressFromEvents({
      rows: [],
      sessionId: "s1",
      dayStartUtc: today,
    });
    expect(p.answeredQuestionIds).toEqual([]);
    expect(p.currentAttachmentQuestionId).toBeNull();
  });
});
