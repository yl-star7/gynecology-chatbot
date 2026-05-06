import {
  formatMobilePregnancyWeekDayLabel,
  getMobilePregnancyDayCountFromContentDayNumber,
} from "@gynecology-chatbot/app-core";

export function formatMobileWeekDayLabel(
  weekNumber: number,
  contentDayNumber: number,
) {
  return formatMobilePregnancyWeekDayLabel(weekNumber, contentDayNumber);
}

export function formatMobileWeekDayRangeLabel(weekNumber: number) {
  return `${weekNumber}주 0~6일`;
}

export function getMobilePregnancyDayCount(
  weekNumber: number,
  contentDayNumber: number,
) {
  return getMobilePregnancyDayCountFromContentDayNumber(
    weekNumber,
    contentDayNumber,
  );
}
