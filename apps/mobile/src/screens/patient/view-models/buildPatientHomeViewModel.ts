import type { HomeViewData, MobileProfileViewData } from "@gynecology-chatbot/app-core";
import {
  DEFAULT_BABY_MESSAGE,
  DEFAULT_BABY_NAME,
  DEFAULT_SUPPORT_MESSAGE,
} from "./patient-copy";

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

function getDaysUntilDue(dueDate?: string | null, now?: Date) {
  if (!dueDate) {
    return null;
  }

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return null;
  }

  const base = now ?? new Date();
  const diff = due.getTime() - base.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
  const pregnancyWeekLabel =
    home?.pregnancyWeekLabel ?? profile?.pregnancyWeekLabel ?? "주차 정보를 준비 중이에요";
  const pregnancyDayCount = home?.pregnancyDayCount ?? profile?.pregnancyDayCount ?? 0;
  const daysUntilDue = getDaysUntilDue(profile?.dueDate, now);

  return {
    heroName,
    monthLabel: formatMonthLabel(now),
    dayLabel: String(now.getDate()),
    babyMessage: buildBabyMessage({ pregnancyWeekLabel, babyName: heroName }),
    supportMessage: DEFAULT_SUPPORT_MESSAGE,
    pregnancyWeekLabel,
    pregnancyDayCount,
    meetingLabel: daysUntilDue == null ? "함께한 시간" : "만나기까지",
    meetingValue: daysUntilDue == null ? `${pregnancyDayCount}일` : `${daysUntilDue}일`,
    quote: `${heroName}와 함께 보내는 오늘도 충분히 잘하고 있어요.`,
    noteTitle: "오늘의 한마디",
    noteBody:
      profile?.tonePreference?.trim() ||
      "몸이 보내는 신호를 너무 급하게 판단하지 말고, 오늘 느낀 것을 차분히 살펴봐요.",
    primaryActionLabel: "오늘,우리 보기",
    secondaryActionLabel: "오늘 내용 보기",
  };
}
