export function parsePregnancyWeekLabel(label?: string | null) {
  if (!label) {
    return null;
  }

  const match = label.match(/(\d{1,2})\s*주/);
  if (!match) {
    return null;
  }

  const week = Number(match[1]);
  if (!Number.isFinite(week)) {
    return null;
  }

  return week;
}

export function resolveWeekBabyImageWeek(weekLabel?: string | null) {
  const parsedWeek = parsePregnancyWeekLabel(weekLabel);
  if (!parsedWeek) {
    return 18;
  }

  return Math.max(5, Math.min(40, parsedWeek));
}

export function getWeekBabyImagePath(weekLabel?: string | null) {
  const week = resolveWeekBabyImageWeek(weekLabel);
  return `/week-baby/week-baby-w${String(week).padStart(2, "0")}.png`;
}
