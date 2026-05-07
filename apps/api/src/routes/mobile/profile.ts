import { Hono } from "hono";
import {
  calculatePregnancyPositionFromDueDate,
  DEFAULT_MOBILE_THEME_KEY,
  createKoreanDateKey,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";
import {
  hasCompletedProfileOnboarding,
  updateMobileProfile,
} from "@gynecology-chatbot/mobile-api/auth";
import {
  dbInsert,
  dbSelect,
  dbUpdate,
} from "@gynecology-chatbot/mobile-api/db/admin-client";
import { decryptPhoneNumber } from "@gynecology-chatbot/mobile-api/privacy/phone-crypto";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";

const app = new Hono();

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

function asObject<T>(value: unknown): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}

function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function formatTimeOnly(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString().slice(11, 19) : value;
}

function getKstDateKey() {
  return createKoreanDateKey();
}

function resolveCurrentPregnancyPosition(profile: ProfileRow | null) {
  if (!profile) {
    return null;
  }

  if (profile.due_date) {
    const position = calculatePregnancyPositionFromDueDate(
      profile.due_date,
      getKstDateKey(),
    );
    return {
      week: position.weekNumber,
      dayInWeek: position.dayNumber - 1,
    };
  }

  if (!profile.pregnancy_week) {
    return null;
  }

  return {
    week: profile.pregnancy_week,
    dayInWeek: profile.pregnancy_day_in_week ?? 0,
  };
}

function formatPregnancyWeekLabel(profile: ProfileRow | null) {
  const position = resolveCurrentPregnancyPosition(profile);
  return position ? `${position.week}주 ${position.dayInWeek}일` : "정보 없음";
}

app.get("/", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const { userId } = await requireMobileSession(c, hintedUserId);

    const [userRecord, profileRecord] = await Promise.all([
      dbSelect<UserRow[]>(
        `users?select=id,phone_number_encrypted,account_status&id=eq.${userId}&limit=1`,
      ).then((rows) => rows[0] ?? null),
      dbSelect<
        Array<
          Omit<ProfileRow, "onboarding_payload"> & {
            onboarding_payload: unknown;
          }
        >
      >(
        `pregnancy_profiles?select=display_name,pregnancy_day_count,pregnancy_week,pregnancy_day_in_week,due_date,onboarding_payload,baby_nickname,notification_time,theme_key&user_id=eq.${userId}&limit=1`,
      ).then((rows) => rows[0] ?? null),
    ]);

    if (!userRecord?.phone_number_encrypted) {
      return c.json({ error: "user not found" }, 404);
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

    const currentPregnancyPosition = resolveCurrentPregnancyPosition(profile);

    if (currentPregnancyPosition) {
      try {
        const dayNumber = (currentPregnancyPosition.dayInWeek % 7) + 1;
        const weekRecord = (
          await dbSelect<WeekRow[]>(
            `content_pregnancy_week_data?select=id&week_number=eq.${currentPregnancyPosition.week}&status=eq.published&limit=1`,
          )
        )[0];
        const week: WeekRow | null = weekRecord;

        if (week) {
          const [datedQuestion, genericQuestion] = await Promise.all([
            dbSelect<QuestionRow[]>(
              `content_week_questions?select=id,code,question_text,question_type,help_text,question_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc&limit=1`,
            ).then((rows) => rows[0] ?? null),
            dbSelect<QuestionRow[]>(
              `content_week_questions?select=id,code,question_text,question_type,help_text,question_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc&limit=1`,
            ).then((rows) => rows[0] ?? null),
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
            ? await dbSelect<QuestionEventRow[]>(
                `user_question_events?select=id,question_id,status&user_id=eq.${userId}&question_id=eq.${question.id}`,
              )
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

    return c.json({
      profile: {
        userId: user.id,
        displayName: profile?.display_name ?? "사용자",
        phoneNumber: decryptPhoneNumber(user.phone_number_encrypted),
        pregnancyWeekLabel: formatPregnancyWeekLabel(profile),
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
    return mobileRouteErrorResponse(c, error, "failed to load profile");
  }
});

app.patch("/", async (c) => {
  try {
    const body = await c.req.json();
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
      return c.json({ error: "상담 분위기를 선택해주세요." }, 400);
    }

    const notificationTime = normalizeNotificationTimeInput(
      notificationTimeInput,
    );
    if (!notificationTime) {
      return c.json({ error: NOTIFICATION_TIME_ERROR }, 400);
    }

    const { userId } = await requireMobileSession(c, hintedUserId);

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

    return c.json({ user });
  } catch (error) {
    console.error("mobile profile patch route error", error);
    return mobileRouteErrorResponse(c, error, "failed to update profile", 400);
  }
});

// POST /api/mobile/profile/surveys
app.post("/surveys", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const questionId =
      typeof body.questionId === "string" ? body.questionId.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";

    if (!questionId || !answer) {
      return c.json({ error: "questionId and answer are required" }, 400);
    }

    const { userId } = await requireMobileSession(c, hintedUserId);

    const questionRecord = (
      await dbSelect<
        Array<{
          id: string;
          question_text: string;
          question_type: string;
          help_text: string | null;
          question_payload: unknown;
        }>
      >(
        `content_week_questions?select=id,question_text,question_type,help_text,question_payload&id=eq.${questionId}&limit=1`,
      )
    )[0];
    const question = questionRecord
      ? {
          id: questionRecord.id,
          question_text: questionRecord.question_text,
          question_type: questionRecord.question_type,
          help_text: questionRecord.help_text,
          question_payload: questionRecord.question_payload,
        }
      : null;

    if (!question) {
      return c.json({ error: "question not found" }, 404);
    }

    const now = new Date().toISOString();

    await dbInsert("calendar_logs", {
      user_id: userId,
      session_id: null,
      date: getKstDateKey(),
      entry_type: "survey_response",
      title: question.question_text,
      summary: answer,
      payload: {
        questionId: question.id,
        questionType: question.question_type,
        answer,
        source: "profile_survey",
      },
    });

    const existingEvent = (
      await dbSelect<Array<{ id: string }>>(
        `user_question_events?select=id&user_id=eq.${userId}&question_id=eq.${questionId}&order=updated_at.desc&limit=1`,
      )
    )[0];

    if (existingEvent?.id) {
      await dbUpdate(`user_question_events?id=eq.${existingEvent.id}`, {
        status: "answered",
        answer_message_id: null,
        answer_text: answer,
        answered_at: now,
        updated_at: now,
      });
    } else {
      await dbInsert("user_question_events", {
        user_id: userId,
        question_id: questionId,
        session_id: null,
        prompt_message_id: null,
        answer_message_id: null,
        status: "answered",
        sent_at: now,
        answer_text: answer,
        answered_at: now,
        updated_at: now,
      });
    }

    return c.json({ ok: true });
  } catch (error) {
    console.error("mobile profile surveys route error", error);
    return mobileRouteErrorResponse(
      c,
      error,
      "failed to submit survey answer",
      400,
    );
  }
});

export default app;
