const DEFAULT_WEEK_BABY_IMAGE_WEEK = 18;
const MIN_SUPPORTED_WEEK = 5;
const MAX_SUPPORTED_WEEK = 40;

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
    return DEFAULT_WEEK_BABY_IMAGE_WEEK;
  }

  return Math.max(MIN_SUPPORTED_WEEK, Math.min(MAX_SUPPORTED_WEEK, parsedWeek));
}

export const weekBabyImages = {
  5: require("../../../assets/week-baby/week-baby-w05.png"),
  6: require("../../../assets/week-baby/week-baby-w06.png"),
  7: require("../../../assets/week-baby/week-baby-w07.png"),
  8: require("../../../assets/week-baby/week-baby-w08.png"),
  9: require("../../../assets/week-baby/week-baby-w09.png"),
  10: require("../../../assets/week-baby/week-baby-w10.png"),
  11: require("../../../assets/week-baby/week-baby-w11.png"),
  12: require("../../../assets/week-baby/week-baby-w12.png"),
  13: require("../../../assets/week-baby/week-baby-w13.png"),
  14: require("../../../assets/week-baby/week-baby-w14.png"),
  15: require("../../../assets/week-baby/week-baby-w15.png"),
  16: require("../../../assets/week-baby/week-baby-w16.png"),
  17: require("../../../assets/week-baby/week-baby-w17.png"),
  18: require("../../../assets/week-baby/week-baby-w18.png"),
  19: require("../../../assets/week-baby/week-baby-w19.png"),
  20: require("../../../assets/week-baby/week-baby-w20.png"),
  21: require("../../../assets/week-baby/week-baby-w21.png"),
  22: require("../../../assets/week-baby/week-baby-w22.png"),
  23: require("../../../assets/week-baby/week-baby-w23.png"),
  24: require("../../../assets/week-baby/week-baby-w24.png"),
  25: require("../../../assets/week-baby/week-baby-w25.png"),
  26: require("../../../assets/week-baby/week-baby-w26.png"),
  27: require("../../../assets/week-baby/week-baby-w27.png"),
  28: require("../../../assets/week-baby/week-baby-w28.png"),
  29: require("../../../assets/week-baby/week-baby-w29.png"),
  30: require("../../../assets/week-baby/week-baby-w30.png"),
  31: require("../../../assets/week-baby/week-baby-w31.png"),
  32: require("../../../assets/week-baby/week-baby-w32.png"),
  33: require("../../../assets/week-baby/week-baby-w33.png"),
  34: require("../../../assets/week-baby/week-baby-w34.png"),
  35: require("../../../assets/week-baby/week-baby-w35.png"),
  36: require("../../../assets/week-baby/week-baby-w36.png"),
  37: require("../../../assets/week-baby/week-baby-w37.png"),
  38: require("../../../assets/week-baby/week-baby-w38.png"),
  39: require("../../../assets/week-baby/week-baby-w39.png"),
  40: require("../../../assets/week-baby/week-baby-w40.png"),
} as const;

export function getWeekBabyImageSource(weekLabel?: string | null) {
  const week = resolveWeekBabyImageWeek(weekLabel);
  return weekBabyImages[week as keyof typeof weekBabyImages];
}
