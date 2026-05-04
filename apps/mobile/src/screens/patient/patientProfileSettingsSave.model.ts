import { DEFAULT_NOTIFICATION_TIME } from "./patientNotificationTime.model.ts";

type PatientProfileSettingsThemeKey =
  | "rose-sand"
  | "soft-peach"
  | "mint-neutral"
  | "sky-blue";

export type PatientProfileSettingsProfileSnapshot = {
  dueDate?: string | null;
  tonePreference?: string | null;
  babyNickname?: string | null;
  hospitalName?: string | null;
  notificationTime?: string | null;
  themeKey?: PatientProfileSettingsThemeKey | null;
};

export type PatientProfileSettingsSaveDraft = {
  babyNickname: string | null;
  dueDate: string | null;
  hospitalName: string | null;
  notificationTime: string;
  themeKey: PatientProfileSettingsThemeKey;
  tonePreference: string;
};

function normalizeNullableText(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function isThemeOnlyProfileSettingsChange(
  previousProfile: PatientProfileSettingsProfileSnapshot | null,
  draft: PatientProfileSettingsSaveDraft,
) {
  if (!previousProfile) {
    return false;
  }

  const previousThemeKey = previousProfile.themeKey ?? "rose-sand";
  if (previousThemeKey === draft.themeKey) {
    return false;
  }

  return (
    normalizeNullableText(previousProfile.dueDate) ===
      normalizeNullableText(draft.dueDate) &&
    normalizeNullableText(previousProfile.tonePreference) ===
      normalizeNullableText(draft.tonePreference) &&
    normalizeNullableText(previousProfile.babyNickname) ===
      normalizeNullableText(draft.babyNickname) &&
    normalizeNullableText(previousProfile.hospitalName) ===
      normalizeNullableText(draft.hospitalName) &&
    (previousProfile.notificationTime ?? DEFAULT_NOTIFICATION_TIME) ===
      draft.notificationTime
  );
}

export function isThemeOnlyProfileSettingsSave({
  draft,
  hasProfileFieldEdits,
  previousProfile,
  previousThemeKey,
}: {
  draft: PatientProfileSettingsSaveDraft;
  hasProfileFieldEdits: boolean;
  previousProfile: PatientProfileSettingsProfileSnapshot | null;
  previousThemeKey: PatientProfileSettingsThemeKey;
}) {
  if (!previousProfile || previousThemeKey === draft.themeKey) {
    return false;
  }

  if (!hasProfileFieldEdits) {
    return true;
  }

  return isThemeOnlyProfileSettingsChange(previousProfile, draft);
}

export function shouldRescheduleProfileNotification(
  previousProfile: PatientProfileSettingsProfileSnapshot | null,
  draft: PatientProfileSettingsSaveDraft,
) {
  if (!previousProfile) {
    return true;
  }

  return (
    normalizeNullableText(previousProfile.dueDate) !==
      normalizeNullableText(draft.dueDate) ||
    (previousProfile.notificationTime ?? DEFAULT_NOTIFICATION_TIME) !==
      draft.notificationTime
  );
}
