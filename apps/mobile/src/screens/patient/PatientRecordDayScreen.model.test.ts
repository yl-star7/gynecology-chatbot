import assert from "node:assert/strict";
import test from "node:test";
import { createRecordDayActions } from "./PatientRecordDayScreen.model.ts";

test("createRecordDayActions loads the record day through the injected home port", async () => {
  const expected = {
    isoDate: "2026-04-06",
    dateLabel: "2026년 4월 6일 월요일",
    emotionTone: null,
    checklistItems: [],
    records: [],
    relatedSessions: [],
  };

  let loadedIsoDate: string | null = null;
  const actions = createRecordDayActions({
    homePort: {
      async getRecordDay(isoDate: string) {
        loadedIsoDate = isoDate;
        return expected;
      },
    },
    todayPort: {
      async setChecklistItemCompleted() {
        return undefined;
      },
    },
  });

  const result = await actions.loadRecordDay("2026-04-06");

  assert.equal(loadedIsoDate, "2026-04-06");
  assert.equal(result, expected);
});

test("createRecordDayActions toggles checklist items through the injected today port", async () => {
  const calls: { checklistId: string; completed: boolean }[] = [];
  const actions = createRecordDayActions({
    homePort: {
      async getRecordDay() {
        throw new Error("not used");
      },
    },
    todayPort: {
      async setChecklistItemCompleted(input: {
        checklistId: string;
        completed: boolean;
      }) {
        calls.push(input);
      },
    },
  });

  await actions.setChecklistItemCompleted({
    checklistId: "check-1",
    completed: true,
  });

  assert.deepEqual(calls, [{ checklistId: "check-1", completed: true }]);
});
