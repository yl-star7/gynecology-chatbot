import type {
  HomeViewData,
  MobileProfileViewData,
} from "@gynecology-chatbot/app-core";
import {
  DEFAULT_BABY_MESSAGE,
  DEFAULT_BABY_NAME,
  DEFAULT_SUPPORT_MESSAGE,
} from "./patient-copy.ts";
import { pickPatientEncouragementQuote } from "./patient-encouragement-quotes.ts";
import {
  createPregnancyWeekState,
  getPregnancyWeekDisplayLabel,
  getPregnancyWeekImageLabel,
} from "../pregnancyWeek.model.ts";

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const MS_PER_DAY =
  MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;

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

const MAX_PREGNANCY_DAYS = 294;

function computePregnancyDayFromDueDate(
  dueDate?: string | null,
  now?: Date,
): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const base = now ?? new Date();
  const startOfBase = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
  );
  const diff = Math.round((due.getTime() - startOfBase.getTime()) / MS_PER_DAY);
  return Math.max(0, Math.min(MAX_PREGNANCY_DAYS, MAX_PREGNANCY_DAYS - diff));
}

const TONE_MESSAGES: Record<string, string> = {
  차분하게:
    "지금 이 순간, 깊게 숨을 들이쉬고 내쉬어 보세요. 오늘 하루도 잘 해내고 있어요.",
  친근하게:
    "오늘도 수고 많았어요! 아기도 엄마 옆에서 편안하게 하루를 보내고 있을 거예요.",
  전문적으로:
    "규칙적인 태동 확인과 충분한 수분 섭취를 유지하면 건강한 임신 경과에 도움이 됩니다.",
  다정하게:
    "엄마가 느끼는 모든 감정은 소중해요. 오늘도 아기와 함께 따뜻한 하루 보내세요.",
};

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
  const pregnancyWeekState = createPregnancyWeekState({
    homePregnancyWeekLabel: home?.pregnancyWeekLabel,
    profilePregnancyWeekLabel: profile?.pregnancyWeekLabel,
    dueDate: profile?.dueDate,
    now,
  });
  const imageWeekLabel = getPregnancyWeekImageLabel(pregnancyWeekState);
  const pregnancyWeekLabel = getPregnancyWeekDisplayLabel(pregnancyWeekState);
  const postDue = pregnancyWeekLabel === "출산 예정일이 지났어요";

  // 임신 일수: due_date 기반 계산 우선, 서버 값은 폴백
  const computedDayCount = computePregnancyDayFromDueDate(
    profile?.dueDate,
    now,
  );
  const pregnancyDayCount =
    computedDayCount ??
    home?.pregnancyDayCount ??
    profile?.pregnancyDayCount ??
    0;

  const daysUntilDue = getDaysUntilDue(profile?.dueDate, now);
  const quoteSeed = [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    heroName,
    pregnancyWeekLabel,
  ].join("-");

  // babyMessage: 실제 주차가 있을 때만 주차 멘트, 아니면 기본 메시지
  const babyMessage = imageWeekLabel
    ? buildBabyMessage({
        pregnancyWeekLabel: imageWeekLabel,
        babyName: heroName,
      })
    : DEFAULT_BABY_MESSAGE;

  // noteBody: tonePreference를 실제 문구로 매핑
  const tone = profile?.tonePreference?.trim() ?? "";
  const noteBody =
    TONE_MESSAGES[tone] ??
    "몸이 보내는 신호를 너무 급하게 판단하지 말고, 오늘 느낀 것을 차분히 살펴봐요.";

  return {
    heroName,
    monthLabel: formatMonthLabel(now),
    dayLabel: String(now.getDate()),
    babyMessage,
    supportMessage: DEFAULT_SUPPORT_MESSAGE,
    pregnancyWeekLabel,
    imageWeekLabel,
    pregnancyDayCount,
    pregnancyDayText: `임신 ${pregnancyDayCount}일째`,
    meetingLabel: postDue
      ? "함께한 시간"
      : daysUntilDue == null
        ? "함께한 시간"
        : "만나기까지",
    meetingValue:
      postDue || daysUntilDue == null
        ? `${pregnancyDayCount}일`
        : `${daysUntilDue}일`,
    quote: pickPatientEncouragementQuote(quoteSeed),
    noteTitle: "오늘의 한마디",
    noteBody,
    primaryActionLabel: "오늘,우리 보기",
    secondaryActionLabel: "오늘 내용 보기",
  };
}
