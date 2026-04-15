export const DEFAULT_NOTIFICATION_TIME = "08:30";
export const INVALID_NOTIFICATION_TIME_ERROR =
  "알림 시간은 08:30처럼 입력해주세요.";

function normalizeHourMinute(hourText: string, minuteText: string) {
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function normalizePatientNotificationTimeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_NOTIFICATION_TIME;
  }

  const compact = trimmed.replace(/\s+/g, "");
  const digitsOnlyMatch = compact.match(/^\d{3,4}$/);
  if (digitsOnlyMatch) {
    const normalizedDigits = compact.padStart(4, "0");
    return normalizeHourMinute(
      normalizedDigits.slice(0, 2),
      normalizedDigits.slice(2),
    );
  }

  const colonMatch = compact.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    return normalizeHourMinute(colonMatch[1], colonMatch[2]);
  }

  return null;
}
