import type { HomeViewData, MobileProfileViewData } from "@gynecology-chatbot/app-core";
import {
  DEFAULT_BABY_MESSAGE,
  DEFAULT_BABY_NAME,
  DEFAULT_SUPPORT_MESSAGE,
} from "./patient-copy";
import { pickPatientEncouragementQuote } from "./patient-encouragement-quotes";

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const MS_PER_DAY = MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;

function formatMonthLabel(date: Date) {
  return `${date.getMonth() + 1}월`;
}

function buildBabyMessage(input: {
  pregnancyWeekLabel?: string | null;
  babyName: string;
}) {
  if (!input.pregnancyWeekLabel) {
    return DEFAULT_BABY_MESSAGE;
  }

  return `${input.babyName}는 지금 ${input.pregnancyWeekLabel}에 머물고 있어요. 오늘도 엄마와 연결된 시간을 기다리고 있어요.`;
}

function getDaysUntilDue(dueDate?: string | null, now?: Date): number | null {
  if (!dueDate) {
    return null;
  }

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return null;
  }

  const base = now ?? new Date();
  const diff = due.getTime() - base.getTime();
  return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}

function isPostDue(dueDate?: string | null, now?: Date): boolean {
  if (!dueDate) {
    return false;
  }
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  const base = now ?? new Date();
  return due.getTime() < base.getTime();
}

const MIN_PREGNANCY_WEEK = 1;
const MAX_PREGNANCY_WEEK = 42;

function sanitizePregnancyWeekLabel(label: string | null | undefined): string {
  if (!label) {
    return "주차 정보를 준비 중이에요";
  }
  const match = label.match(/^(\d+)/);
  if (match) {
    const week = Number(match[1]);
    if (week < MIN_PREGNANCY_WEEK || week > MAX_PREGNANCY_WEEK) {
      return "주차 정보를 준비 중이에요";
    }
  }
  return label;
}

export function buildPatientHomeViewModel({
  home,
  profile,
  now = new Date(),
}: {
  home: HomeViewData | null;
  profile: MobileProfileViewData | null;
  now?: Date;
}) {
  const heroName = profile?.babyNickname?.trim() || DEFAULT_BABY_NAME;
  const rawWeekLabel = home?.pregnancyWeekLabel ?? profile?.pregnancyWeekLabel ?? null;
  const postDue = isPostDue(profile?.dueDate, now);
  const pregnancyWeekLabel = postDue
    ? "출산 예정일이 지났어요"
    : sanitizePregnancyWeekLabel(rawWeekLabel);
  const pregnancyDayCount = home?.pregnancyDayCount ?? profile?.pregnancyDayCount ?? 0;
  const daysUntilDue = getDaysUntilDue(profile?.dueDate, now);
  const quoteSeed = [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    heroName,
    pregnancyWeekLabel,
  ].join("-");

  return {
    heroName,
    monthLabel: formatMonthLabel(now),
    dayLabel: String(now.getDate()),
    babyMessage: buildBabyMessage({ pregnancyWeekLabel, babyName: heroName }),
    supportMessage: DEFAULT_SUPPORT_MESSAGE,
    pregnancyWeekLabel,
    pregnancyDayCount,
    meetingLabel: postDue ? "함께한 시간" : daysUntilDue == null ? "함께한 시간" : "만나기까지",
    meetingValue:
      postDue || daysUntilDue == null ? `${pregnancyDayCount}일` : `${daysUntilDue}일`,
    quote: pickPatientEncouragementQuote(quoteSeed),
    noteTitle: "오늘의 한마디",
    noteBody:
      profile?.tonePreference?.trim() ||
      "몸이 보내는 신호를 너무 급하게 판단하지 말고, 오늘 느낀 것을 차분히 살펴봐요.",
    primaryActionLabel: "오늘,우리 보기",
    secondaryActionLabel: "오늘 내용 보기",
  };
}
