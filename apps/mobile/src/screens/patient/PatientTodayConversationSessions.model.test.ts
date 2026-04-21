import assert from "node:assert/strict";
import test from "node:test";
import { filterTodayConversationSessions } from "./PatientTodayConversationSessions.model.ts";

test("filterTodayConversationSessions keeps only sessions from the Korean app day", () => {
  const sessions = filterTodayConversationSessions({
    todayIsoDate: "2026-04-21",
    sessions: [
      {
        id: "yesterday",
        title: "어제 대화",
        preview: "어제 내용",
        updatedAtLabel: "어제 오후 11:59",
        updatedAtIso: "2026-04-20T14:59:00.000Z",
      },
      {
        id: "today",
        title: "오늘 대화",
        preview: "오늘 내용",
        updatedAtLabel: "오늘 오전 12:01",
        updatedAtIso: "2026-04-20T15:01:00.000Z",
      },
      {
        id: "unknown",
        title: "날짜 없는 대화",
        preview: "날짜 없음",
        updatedAtLabel: "방금 전",
      },
    ],
  });

  assert.deepEqual(
    sessions.map((session) => session.id),
    ["today"],
  );
});
