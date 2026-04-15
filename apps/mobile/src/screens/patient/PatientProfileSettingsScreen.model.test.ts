import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_NOTIFICATION_TIME,
  normalizePatientNotificationTimeInput,
} from "./PatientProfileSettingsScreen.model.ts";

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
