const ADMIN_VISIBLE_WEEK_MIN = 6;
const ADMIN_VISIBLE_WEEK_MAX = 40;

export function isAdminVisibleWeekNumber(weekNumber: number) {
  return (
    weekNumber >= ADMIN_VISIBLE_WEEK_MIN && weekNumber <= ADMIN_VISIBLE_WEEK_MAX
  );
}

export function getAdminVisibleWeeks<T extends { weekNumber: number }>(
  weeks: T[],
) {
  return weeks.filter((week) => isAdminVisibleWeekNumber(week.weekNumber));
}
