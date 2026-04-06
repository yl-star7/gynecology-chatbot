import {
  createPregnancyWeekState,
  getPregnancyWeekImageLabel,
} from "./pregnancyWeek.model.ts";

const DEFAULT_WEEK_BABY_IMAGE_WEEK = 18;
const MIN_SUPPORTED_WEEK = 5;
const MAX_SUPPORTED_WEEK = 40;

const SUPABASE_STORAGE_URL =
  "https://wmguogzglxktsxnqrqjd.supabase.co/storage/v1/object/public/pregnancy-content/weeks";

const weekBabyFileNames: Record<number, string> = {
  5: "w05-sesame-seed.png",
  6: "w06-pea.png",
  7: "w07-blueberry.png",
  8: "w08-cherry.png",
  9: "w09-grape.png",
  10: "w10-strawberry.png",
  11: "w11-fig.png",
  12: "w12-plum.png",
  13: "w13-lemon.png",
  14: "w14-peach.png",
  15: "w15-apple.png",
  16: "w16-avocado.png",
  17: "w17-pear.png",
  18: "w18-bell-pepper.png",
  19: "w19-pomegranate.png",
  20: "w20-banana.png",
  21: "w21-mango.png",
  22: "w22-sweet-potato.png",
  23: "w23-grapefruit.png",
  24: "w24-corn.png",
  25: "w25-kabocha-squash.png",
  26: "w26-lettuce.png",
  27: "w27-cauliflower.png",
  28: "w28-eggplant.png",
  29: "w29-butternut-squash.png",
  30: "w30-cabbage.png",
  31: "w31-coconut.png",
  32: "w32-celery.png",
  33: "w33-pineapple.png",
  34: "w34-melon.png",
  35: "w35-honeydew-melon.png",
  36: "w36-romaine-lettuce.png",
  37: "w37-green-onion.png",
  38: "w38-radish.png",
  39: "w39-watermelon.png",
  40: "w40-pumpkin.png",
};

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

export function getWeekBabyImageSource(weekLabel?: string | null) {
  const normalizedWeekLabel = getPregnancyWeekImageLabel(
    createPregnancyWeekState({
      homePregnancyWeekLabel: weekLabel,
      profilePregnancyWeekLabel: null,
    }),
  );
  const week = resolveWeekBabyImageWeek(normalizedWeekLabel ?? weekLabel);
  const paddedWeek = String(week).padStart(2, "0");
  const fileName = weekBabyFileNames[week] ?? `w${paddedWeek}-baby.png`;
  return { uri: `${SUPABASE_STORAGE_URL}/${paddedWeek}/${fileName}` };
}
