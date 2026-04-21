import {
  DEFAULT_MOBILE_THEME_KEY,
  createKoreanDateKey,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";
import { NextRequest, NextResponse } from "next/server";
import {
  hasCompletedProfileOnboarding,
  updateMobileProfile,
} from "@/lib/mobile/auth";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { decryptPhoneNumber } from "@/lib/privacy/phone-crypto";

type UserRow = {
  id: string;
  phone_number_encrypted: string;
  account_status: string;
};

type ProfileRow = {
  display_name: string | null;
  pregnancy_day_count: number;
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
  due_date: string | null;
  onboarding_payload: {
    tonePreference?: string;
    pregnancyWeekOrDueDate?: string;
    babyNickname?: string | null;
    hospitalName?: string | null;
    notificationTime?: string | null;
    themeKey?: string | null;
  } | null;
  baby_nickname?: string | null;
  notification_time?: string | null;
  theme_key?: string | null;
};

type WeekRow = { id: string };

type QuestionRow = {
  id: string;
  code: string;
  question_text: string;
  question_type:
    | "text"
    | "single_choice"
    | "multi_choice"
    | "yes_no"
    | "number";
  help_text: string | null;
  question_payload: {
    choices?: Array<{ id?: string; label?: string }>;
    yesLabel?: string;
    noLabel?: string;
  } | null;
  display_order: number;
  is_required: boolean;
};

type QuestionEventRow = {
  id: string;
  question_id: string;
  status: "sent" | "opened" | "answered" | "skipped";
};

const DEFAULT_NOTIFICATION_TIME = "08:30";
const NOTIFICATION_TIME_ERROR =
  "알림 시간은 08:00, 08:15, 08:30, 08:45처럼 입력해주세요.";
const NOTIFICATION_MINUTE_OPTIONS = [0, 15, 30, 45] as const;

function isSupportedNotificationMinute(minute: number) {
  return NOTIFICATION_MINUTE_OPTIONS.includes(
    minute as (typeof NOTIFICATION_MINUTE_OPTIONS)[number],
  );
}

function normalizeNotificationTimeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_NOTIFICATION_TIME;
  }

  const compact = trimmed.replace(/\s+/g, "");
  const digitsOnlyMatch = compact.match(/^\d{3,4}$/);
  if (digitsOnlyMatch) {
    const normalizedDigits = compact.padStart(4, "0");
    const hour = Number(normalizedDigits.slice(0, 2));
    const minute = Number(normalizedDigits.slice(2));
    if (hour > 23 || minute > 59 || !isSupportedNotificationMinute(minute)) {
      return null;
    }
    return `${normalizedDigits.slice(0, 2)}:${normalizedDigits.slice(2)}`;
  }

  const colonMatch = compact.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!colonMatch) {
    return null;
  }

  const hour = Number(colonMatch[1]);
  const minute = Number(colonMatch[2]);
  if (hour > 23 || minute > 59 || !isSupportedNotificationMinute(minute)) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function resolveQuestionChoices(question: QuestionRow) {
  if (question.question_type === "yes_no") {
    return [
      {
        id: "yes",
        label: question.question_payload?.yesLabel?.trim() || "네",
      },
      {
        id: "no",
        label: question.question_payload?.noLabel?.trim() || "아니요",
      },
    ];
  }

  return (question.question_payload?.choices ?? [])
    .map((choice, index) => ({
      id: choice.id?.trim() || `choice-${index + 1}`,
      label: choice.label?.trim() || `선택지 ${index + 1}`,
    }))
    .filter((choice) => choice.label.length > 0);
}

function asObject<T>(value: Prisma.JsonValue | null | undefined): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}

function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function formatTimeOnly(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(11, 19) : value;
}

function getKstDateKey() {
  return createKoreanDateKey();
}

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export async function GET(request: NextRequest) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);

    const [userRecord, profileRecord] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          phone_number_encrypted: true,
          account_status: true,
        },
      }),
      prisma.pregnancy_profiles.findUnique({
        where: { user_id: userId },
        select: {
          display_name: true,
          pregnancy_day_count: true,
          pregnancy_week: true,
          pregnancy_day_in_week: true,
          due_date: true,
          onboarding_payload: true,
          baby_nickname: true,
          notification_time: true,
          theme_key: true,
        },
      }),
    ]);

    if (!userRecord?.phone_number_encrypted) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const user: UserRow = {
      id: userRecord.id,
      phone_number_encrypted: userRecord.phone_number_encrypted,
      account_status: userRecord.account_status,
    };
    const profile: ProfileRow | null = profileRecord
      ? {
          display_name: profileRecord.display_name,
          pregnancy_day_count: profileRecord.pregnancy_day_count,
          pregnancy_week: profileRecord.pregnancy_week,
          pregnancy_day_in_week: profileRecord.pregnancy_day_in_week,
          due_date: formatDateOnly(profileRecord.due_date),
          onboarding_payload: asObject<ProfileRow["onboarding_payload"]>(
            profileRecord.onboarding_payload,
          ),
          baby_nickname: profileRecord.baby_nickname,
          notification_time: formatTimeOnly(profileRecord.notification_time),
          theme_key: profileRecord.theme_key,
        }
      : null;

    let pendingSurveys: Array<{
      id: string;
      code: string;
      questionText: string;
      questionType: QuestionRow["question_type"];
      helpText: string | null;
      choices: ReturnType<typeof resolveQuestionChoices>;
      answered: boolean;
    }> = [];

    if (profile?.pregnancy_week) {
      try {
        const dayNumber = ((profile.pregnancy_day_in_week ?? 0) % 7) + 1;
        const weekRecord = await prisma.content_pregnancy_week_data.findFirst({
          where: {
            week_number: profile.pregnancy_week,
            status: "published",
          },
          select: { id: true },
        });
        const week: WeekRow | null = weekRecord;

        if (week) {
          const [datedQuestion, genericQuestion] = await Promise.all([
            prisma.content_week_questions.findFirst({
              where: {
                week_data_id: week.id,
                day_number: dayNumber,
                is_active: true,
              },
              orderBy: { display_order: "asc" },
              select: {
                id: true,
                code: true,
                question_text: true,
                question_type: true,
                help_text: true,
                question_payload: true,
                display_order: true,
                is_required: true,
              },
            }),
            prisma.content_week_questions.findFirst({
              where: {
                week_data_id: week.id,
                day_number: null,
                is_active: true,
              },
              orderBy: { display_order: "asc" },
              select: {
                id: true,
                code: true,
                question_text: true,
                question_type: true,
                help_text: true,
                question_payload: true,
                display_order: true,
                is_required: true,
              },
            }),
          ]);

          const questionRecord = datedQuestion ?? genericQuestion ?? null;
          const question: QuestionRow | null = questionRecord
            ? {
                id: questionRecord.id,
                code: questionRecord.code,
                question_text: questionRecord.question_text,
                question_type:
                  questionRecord.question_type as QuestionRow["question_type"],
                help_text: questionRecord.help_text,
                question_payload: asObject<QuestionRow["question_payload"]>(
                  questionRecord.question_payload,
                ),
                display_order: questionRecord.display_order,
                is_required: questionRecord.is_required,
              }
            : null;
          const questionEvents = question
            ? await prisma.user_question_events.findMany({
                where: {
                  user_id: userId,
                  question_id: question.id,
                },
                select: {
                  id: true,
                  question_id: true,
                  status: true,
                },
              })
            : [];
          const answered = (questionEvents as QuestionEventRow[]).some(
            (event) => event.status === "answered",
          );

          pendingSurveys =
            question && !answered
              ? [
                  {
                    id: question.id,
                    code: question.code,
                    questionText: question.question_text,
                    questionType: question.question_type,
                    helpText: question.help_text,
                    choices: resolveQuestionChoices(question),
                    answered: false,
                  },
                ]
              : [];
        }
      } catch (error) {
        console.error("mobile profile pending survey error", error);
      }
    }

    return NextResponse.json({
      profile: {
        userId: user.id,
        displayName: profile?.display_name ?? "사용자",
        phoneNumber: decryptPhoneNumber(user.phone_number_encrypted),
        pregnancyWeekLabel: profile?.pregnancy_week
          ? `${profile.pregnancy_week}주 ${profile.pregnancy_day_in_week ?? 0}일`
          : "정보 없음",
        pregnancyDayCount: profile?.pregnancy_day_count ?? 0,
        accountStatus: user.account_status,
        hasCompletedOnboarding: hasCompletedProfileOnboarding(profile),
        dueDate: profile?.due_date ?? null,
        tonePreference: profile?.onboarding_payload?.tonePreference ?? null,
        pregnancyWeekOrDueDate:
          profile?.onboarding_payload?.pregnancyWeekOrDueDate ?? null,
        babyNickname:
          profile?.baby_nickname ??
          profile?.onboarding_payload?.babyNickname ??
          null,
        hospitalName: profile?.onboarding_payload?.hospitalName ?? null,
        notificationTime:
          profile?.notification_time ??
          profile?.onboarding_payload?.notificationTime ??
          "08:30",
        themeKey: resolveMobileThemeKey(
          profile?.theme_key ??
            profile?.onboarding_payload?.themeKey ??
            DEFAULT_MOBILE_THEME_KEY,
        ),
        pendingSurveys,
      },
    });
  } catch (error) {
    console.error("mobile profile route error", error);
    return mobileRouteErrorResponse(error, "failed to load profile");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const hintedUserId =
      typeof body.userId === "string" ? body.userId.trim() : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
    const tonePreference =
      typeof body.tonePreference === "string" ? body.tonePreference.trim() : "";
    const babyNickname =
      typeof body.babyNickname === "string" ? body.babyNickname.trim() : "";
    const hospitalName =
      typeof body.hospitalName === "string" ? body.hospitalName.trim() : "";
    const notificationTimeInput =
      typeof body.notificationTime === "string"
        ? body.notificationTime.trim()
        : "";
    const themeKey =
      typeof body.themeKey === "string" ? body.themeKey.trim() : "";

    if (!tonePreference) {
      return NextResponse.json(
        { error: "상담 분위기를 선택해주세요." },
        { status: 400 },
      );
    }

    const notificationTime = normalizeNotificationTimeInput(
      notificationTimeInput,
    );
    if (!notificationTime) {
      return NextResponse.json(
        { error: NOTIFICATION_TIME_ERROR },
        { status: 400 },
      );
    }

    const { userId } = await requireMobileSession(request, hintedUserId);

    const user = await updateMobileProfile({
      userId,
      displayName,
      dueDate: dueDate || null,
      tonePreference,
      babyNickname: babyNickname || null,
      hospitalName: hospitalName || null,
      notificationTime,
      themeKey: themeKey || DEFAULT_MOBILE_THEME_KEY,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("mobile profile patch route error", error);
    return mobileRouteErrorResponse(error, "failed to update profile", 400);
  }
}
