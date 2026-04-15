import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDailyLocalNotificationRequest,
  parseDailyNotificationTime,
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
