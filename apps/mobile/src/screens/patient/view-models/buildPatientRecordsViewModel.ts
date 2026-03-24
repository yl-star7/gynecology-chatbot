import type { CalendarDay, HomeViewData } from "@gynecology-chatbot/app-core";
import { DEFAULT_RECORD_EMPTY } from "./patient-copy";

function resolveChipLabel(day: CalendarDay) {
  if (day.summary?.trim()) {
    return day.summary;
  }

  if (day.emotionTone === "joyful") return "기분이 밝았어요";
  if (day.emotionTone === "calm") return "차분한 하루였어요";
  if (day.emotionTone === "anxious") return "마음을 살펴봤어요";
  if (day.emotionTone === "tired") return "충분한 쉬임이 필요했어요";
  if (day.emotionTone === "sad") return "위로가 필요했어요";
  if (day.hasChat) return "대화를 남겼어요";

  return "기록을 시작해보세요";
}

function resolveStatusTone(day: CalendarDay) {
  if (day.emotionTone === "joyful") return "success";
  if (day.emotionTone === "calm") return "calm";
  if (day.emotionTone === "anxious") return "warning";
  if (day.emotionTone === "tired") return "tired";
  if (day.emotionTone === "sad") return "muted";
  if (day.hasChat) return "calm";
  return "idle";
}

export function buildPatientRecordsViewModel(home: HomeViewData | null) {
  const days = (home?.calendarDays ?? []).map((day) => ({
    isoDate: day.isoDate,
    dayLabel: day.dayLabel,
    chipLabel: resolveChipLabel(day),
    statusTone: resolveStatusTone(day),
    hasChat: day.hasChat,
    emotionTone: day.emotionTone,
  }));

  return {
    title: "기록과 회고",
    description:
      days.length > 0
        ? "남겨둔 마음과 상담 기록을 하루 단위로 다시 볼 수 있어요."
        : DEFAULT_RECORD_EMPTY,
    days,
  };
}
