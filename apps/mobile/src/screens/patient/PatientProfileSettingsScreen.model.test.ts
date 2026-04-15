import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPatientNotificationTimeFromParts,
  DEFAULT_NOTIFICATION_TIME,
  getPatientNotificationTimeParts,
  normalizePatientNotificationTimeInput,
} from "./patientNotificationTime.model.ts";

test("normalizePatientNotificationTimeInput defaults when the input is empty", () => {
  assert.equal(
    normalizePatientNotificationTimeInput("   "),
    DEFAULT_NOTIFICATION_TIME,
  );
});

test("normalizePatientNotificationTimeInput pads compact digits", () => {
  assert.equal(normalizePatientNotificationTimeInput("830"), "08:30");
  assert.equal(normalizePatientNotificationTimeInput("9:5"), "09:05");
});

test("normalizePatientNotificationTimeInput rejects invalid times", () => {
  assert.equal(normalizePatientNotificationTimeInput("25:10"), null);
  assert.equal(normalizePatientNotificationTimeInput("1260"), null);
  assert.equal(normalizePatientNotificationTimeInput("아침 여덟시"), null);
});

test("getPatientNotificationTimeParts returns padded labels", () => {
  assert.deepEqual(getPatientNotificationTimeParts("9:5"), {
    hour: 9,
    minute: 5,
    hourLabel: "09",
    minuteLabel: "05",
  });
});

test("buildPatientNotificationTimeFromParts formats a timer selection", () => {
  assert.equal(buildPatientNotificationTimeFromParts(6, 7), "06:07");
});
