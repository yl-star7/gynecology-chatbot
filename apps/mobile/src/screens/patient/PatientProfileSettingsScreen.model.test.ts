import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPatientNotificationTimeFromParts,
  DEFAULT_NOTIFICATION_TIME,
  getPatientNotificationTimeParts,
  normalizePatientNotificationTimeInput,
  PATIENT_NOTIFICATION_MINUTE_OPTIONS,
} from "./patientNotificationTime.model.ts";

test("normalizePatientNotificationTimeInput defaults when the input is empty", () => {
  assert.equal(
    normalizePatientNotificationTimeInput("   "),
    DEFAULT_NOTIFICATION_TIME,
  );
});

test("normalizePatientNotificationTimeInput pads compact digits", () => {
  assert.equal(normalizePatientNotificationTimeInput("830"), "08:30");
  assert.equal(normalizePatientNotificationTimeInput("9:45"), "09:45");
});

test("normalizePatientNotificationTimeInput rejects invalid times", () => {
  assert.equal(normalizePatientNotificationTimeInput("25:10"), null);
  assert.equal(normalizePatientNotificationTimeInput("1260"), null);
  assert.equal(normalizePatientNotificationTimeInput("아침 여덟시"), null);
});

test("PATIENT_NOTIFICATION_MINUTE_OPTIONS exposes the quarter-hour choices", () => {
  assert.deepEqual([...PATIENT_NOTIFICATION_MINUTE_OPTIONS], [0, 15, 30, 45]);
});

test("getPatientNotificationTimeParts returns padded labels", () => {
  assert.deepEqual(getPatientNotificationTimeParts("9:45"), {
    hour: 9,
    minute: 45,
    hourLabel: "09",
    minuteLabel: "45",
  });
});

test("buildPatientNotificationTimeFromParts formats a timer selection", () => {
  assert.equal(buildPatientNotificationTimeFromParts(6, 7), "06:07");
});
