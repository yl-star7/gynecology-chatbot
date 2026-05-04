import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPatientNotificationTimeFromParts,
  DEFAULT_NOTIFICATION_TIME,
  getPatientNotificationTimeParts,
  normalizePatientNotificationTimeInput,
  PATIENT_NOTIFICATION_MINUTE_OPTIONS,
} from "./patientNotificationTime.model.ts";
import {
  isThemeOnlyProfileSettingsChange,
  isThemeOnlyProfileSettingsSave,
  shouldRescheduleProfileNotification,
} from "./patientProfileSettingsSave.model.ts";

const baseProfile = {
  userId: "user-1",
  displayName: "김수아",
  phoneNumber: "01012345678",
  pregnancyWeekLabel: "19주 1일",
  pregnancyDayCount: 128,
  accountStatus: "active",
  hasCompletedOnboarding: true,
  dueDate: "2026-08-01",
  tonePreference: "차분하게",
  babyNickname: "튼튼이",
  hospitalName: "아가야 병원",
  notificationTime: "08:30",
  themeKey: "rose-sand",
};

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

test("isThemeOnlyProfileSettingsChange detects a pure app color change", () => {
  assert.equal(
    isThemeOnlyProfileSettingsChange(baseProfile, {
      babyNickname: "튼튼이",
      dueDate: "2026-08-01",
      hospitalName: "아가야 병원",
      notificationTime: "08:30",
      themeKey: "sky-blue",
      tonePreference: "차분하게",
    }),
    true,
  );
});

test("isThemeOnlyProfileSettingsChange rejects profile field changes", () => {
  assert.equal(
    isThemeOnlyProfileSettingsChange(baseProfile, {
      babyNickname: "튼튼이",
      dueDate: "2026-08-02",
      hospitalName: "아가야 병원",
      notificationTime: "08:30",
      themeKey: "sky-blue",
      tonePreference: "차분하게",
    }),
    false,
  );
});

test("isThemeOnlyProfileSettingsSave trusts the edited fields when only color was touched", () => {
  assert.equal(
    isThemeOnlyProfileSettingsSave({
      previousProfile: {
        ...baseProfile,
        tonePreference: null,
      },
      previousThemeKey: "rose-sand",
      hasProfileFieldEdits: false,
      draft: {
        babyNickname: "튼튼이",
        dueDate: "2026-08-01",
        hospitalName: "아가야 병원",
        notificationTime: "08:30",
        themeKey: "sky-blue",
        tonePreference: "차분하게",
      },
    }),
    true,
  );
});

test("shouldRescheduleProfileNotification ignores theme-only changes", () => {
  assert.equal(
    shouldRescheduleProfileNotification(baseProfile, {
      babyNickname: "튼튼이",
      dueDate: "2026-08-01",
      hospitalName: "아가야 병원",
      notificationTime: "08:30",
      themeKey: "mint-neutral",
      tonePreference: "차분하게",
    }),
    false,
  );
});

test("shouldRescheduleProfileNotification detects schedule input changes", () => {
  assert.equal(
    shouldRescheduleProfileNotification(baseProfile, {
      babyNickname: "튼튼이",
      dueDate: "2026-08-01",
      hospitalName: "아가야 병원",
      notificationTime: "08:45",
      themeKey: "rose-sand",
      tonePreference: "차분하게",
    }),
    true,
  );
});
