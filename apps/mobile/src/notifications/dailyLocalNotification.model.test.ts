import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDailyLocalNotificationScheduleKey,
  buildDailyLocalNotificationRequest,
  buildRollingDailyLocalNotificationRequests,
  parseDailyNotificationTime,
  syncDailyLocalNotificationSchedule,
} from "./dailyLocalNotification.model.ts";

test("buildDailyLocalNotificationRequest uses the pregnancy week in the notification title", () => {
  const request = buildDailyLocalNotificationRequest({
    notificationTime: "09:00",
    pregnancyWeekLabel: "18주 2일",
  });

  assert.equal(request.title, "[18주차] 오늘은 어때요?");
  assert.equal(request.body, "오늘의 변화를 함께 확인해보세요.");
  assert.deepEqual(request.data, { type: "daily_tip" });
  assert.deepEqual(request.trigger, { hour: 9, minute: 0 });
});

test("buildDailyLocalNotificationRequest falls back when a week label is unavailable", () => {
  const request = buildDailyLocalNotificationRequest({
    notificationTime: "",
    pregnancyWeekLabel: "출산 예정일이 지났어요",
  });

  assert.equal(request.title, "오늘은 어때요?");
  assert.deepEqual(request.trigger, { hour: 8, minute: 30 });
});

test("parseDailyNotificationTime accepts normalized or compact user input", () => {
  assert.deepEqual(parseDailyNotificationTime("9:00"), { hour: 9, minute: 0 });
  assert.deepEqual(parseDailyNotificationTime("0900"), { hour: 9, minute: 0 });
  assert.deepEqual(parseDailyNotificationTime("24:00"), {
    hour: 8,
    minute: 30,
  });
});

test("buildRollingDailyLocalNotificationRequests advances the week title by scheduled day", () => {
  const requests = buildRollingDailyLocalNotificationRequests({
    notificationTime: "09:00",
    pregnancyDayCount: 132,
    now: new Date(2026, 3, 15, 10, 0),
    days: 3,
  });

  assert.deepEqual(
    requests.map((request) => request.title),
    [
      "[18주차] 오늘은 어때요?",
      "[19주차] 오늘은 어때요?",
      "[19주차] 오늘은 어때요?",
    ],
  );
  assert.deepEqual(
    requests.map((request) => request.identifier),
    ["patient-daily-tip-0", "patient-daily-tip-1", "patient-daily-tip-2"],
  );
  assert.deepEqual(
    requests.map((request) => [
      request.date.getFullYear(),
      request.date.getMonth(),
      request.date.getDate(),
      request.date.getHours(),
      request.date.getMinutes(),
    ]),
    [
      [2026, 3, 16, 9, 0],
      [2026, 3, 17, 9, 0],
      [2026, 3, 18, 9, 0],
    ],
  );
});

test("buildRollingDailyLocalNotificationRequests starts today when the configured time has not passed", () => {
  const requests = buildRollingDailyLocalNotificationRequests({
    notificationTime: "21:15",
    pregnancyDayCount: 128,
    now: new Date(2026, 3, 15, 10, 0),
    days: 1,
  });

  assert.equal(requests[0]?.date.getDate(), 15);
  assert.equal(requests[0]?.date.getHours(), 21);
  assert.equal(requests[0]?.date.getMinutes(), 15);
  assert.equal(requests[0]?.title, "[18주차] 오늘은 어때요?");
});

test("buildRollingDailyLocalNotificationRequests can derive day count from a week label", () => {
  const requests = buildRollingDailyLocalNotificationRequests({
    notificationTime: "09:00",
    pregnancyWeekLabel: "18주 6일",
    now: new Date(2026, 3, 15, 10, 0),
    days: 2,
  });

  assert.deepEqual(
    requests.map((request) => request.title),
    ["[18주차] 오늘은 어때요?", "[19주차] 오늘은 어때요?"],
  );
});

test("buildRollingDailyLocalNotificationRequests prefers the current week label over a stale day count", () => {
  const requests = buildRollingDailyLocalNotificationRequests({
    notificationTime: "09:00",
    pregnancyWeekLabel: "30주 1일",
    pregnancyDayCount: 195,
    now: new Date(2026, 3, 15, 10, 0),
    days: 2,
  });

  assert.deepEqual(
    requests.map((request) => request.title),
    ["[30주차] 오늘은 어때요?", "[30주차] 오늘은 어때요?"],
  );
});

test("buildRollingDailyLocalNotificationRequests keeps early pregnancy at week one", () => {
  const requests = buildRollingDailyLocalNotificationRequests({
    notificationTime: "09:00",
    pregnancyDayCount: 1,
    now: new Date(2026, 3, 15, 10, 0),
    days: 1,
  });

  assert.equal(requests[0]?.title, "[1주차] 오늘은 어때요?");
});

test("buildDailyLocalNotificationScheduleKey changes when the app opens on a new local day", () => {
  assert.equal(
    buildDailyLocalNotificationScheduleKey({
      notificationTime: "09:00",
      pregnancyWeekLabel: "18주 6일",
      pregnancyDayCount: 132,
      now: new Date(2026, 3, 15, 10, 0),
    }),
    "2026-04-15:09:00:18주 6일:132",
  );
  assert.equal(
    buildDailyLocalNotificationScheduleKey({
      notificationTime: "09:00",
      pregnancyWeekLabel: "18주 6일",
      pregnancyDayCount: 132,
      now: new Date(2026, 3, 16, 10, 0),
    }),
    "2026-04-16:09:00:18주 6일:132",
  );
});

test("syncDailyLocalNotificationSchedule forwards the stored profile values to scheduling", async () => {
  const scheduledInputs: unknown[] = [];

  const result = await syncDailyLocalNotificationSchedule({
    profile: {
      notificationTime: "06:07",
      pregnancyWeekLabel: "18주 2일",
      pregnancyDayCount: 128,
    },
    now: new Date(2026, 3, 15, 10, 0),
    scheduleLocalNotification: async (input) => {
      scheduledInputs.push(input);
    },
  });

  assert.equal(result.didSchedule, true);
  assert.equal(result.scheduleKey, "2026-04-15:06:07:18주 2일:128");
  assert.deepEqual(result.scheduleInput, {
    notificationTime: "06:07",
    pregnancyWeekLabel: "18주 2일",
    pregnancyDayCount: 128,
  });
  assert.deepEqual(scheduledInputs, [
    {
      notificationTime: "06:07",
      pregnancyWeekLabel: "18주 2일",
      pregnancyDayCount: 128,
    },
  ]);
});

test("syncDailyLocalNotificationSchedule skips rescheduling when the key is unchanged", async () => {
  let callCount = 0;

  const result = await syncDailyLocalNotificationSchedule({
    profile: {
      notificationTime: "06:07",
      pregnancyWeekLabel: "18주 2일",
      pregnancyDayCount: 128,
    },
    previousScheduleKey: "2026-04-15:06:07:18주 2일:128",
    now: new Date(2026, 3, 15, 10, 0),
    scheduleLocalNotification: async () => {
      callCount += 1;
    },
  });

  assert.equal(result.didSchedule, false);
  assert.equal(result.scheduleKey, "2026-04-15:06:07:18주 2일:128");
  assert.equal(callCount, 0);
});
