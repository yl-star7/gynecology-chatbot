import type { AdminWeekDetail } from "@gynecology-chatbot/app-core";

import { formatMobileWeekDayLabel } from "./admin-week-day-labels";

export interface WeekPublishReview {
  isReady: boolean;
  missingItems: string[];
}

export type WeekPublishDayStatus = "complete" | "partial" | "empty";

export function getWeekPublishDayStatus(
  week: AdminWeekDetail,
  dayNumber: number,
): WeekPublishDayStatus {
  const day = week.days.find((entry) => entry.dayNumber === dayNumber);
  if (!day) {
    return "empty";
  }

  const hasBabyCopy = day.babyDevelopmentItems.some((item) => item.trim());
  const hasMotherCopy = day.motherChangesItems.some((item) => item.trim());
  const hasChecklist = week.sections.some(
    (section) =>
      section.dayNumber === dayNumber &&
      section.title.trim() &&
      section.body.trim(),
  );
  const hasQuestion = week.assets.some(
    (asset) => dayNumber === asset.dayNumber && asset.storagePath.trim(),
  );

  if (hasBabyCopy && hasMotherCopy && hasChecklist && hasQuestion) {
    return "complete";
  }

  if (hasBabyCopy || hasMotherCopy || hasChecklist || hasQuestion) {
    return "partial";
  }

  return "empty";
}

export function getWeekPublishReview(week: AdminWeekDetail): WeekPublishReview {
  const missingItems: string[] = [];

  if (!week.title.trim()) {
    missingItems.push("주차 제목");
  }

  if (!week.babySummary.trim()) {
    missingItems.push("아기 요약");
  }

  if (!week.motherSummary.trim()) {
    missingItems.push("엄마 요약");
  }

  const dayMap = new Map(week.days.map((day) => [day.dayNumber, day]));
  for (let dayNumber = 1; dayNumber <= 7; dayNumber += 1) {
    const dayLabel = formatMobileWeekDayLabel(week.weekNumber, dayNumber);
    if (!dayMap.has(dayNumber)) {
      missingItems.push(dayLabel);
      continue;
    }

    if (getWeekPublishDayStatus(week, dayNumber) !== "complete") {
      missingItems.push(dayLabel);
    }
  }

  return {
    isReady: missingItems.length === 0,
    missingItems,
  };
}
