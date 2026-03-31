import {
  DEFAULT_MOBILE_THEME_KEY,
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
import { supabaseSelect } from "@/lib/supabase/admin-client";
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

type WeekRow = {
  id: string;
};

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

export async function GET(request: NextRequest) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);

    const [users, profiles] = await Promise.all([
      supabaseSelect<UserRow[]>(
        `users?select=id,phone_number_encrypted,account_status&id=eq.${userId}&limit=1`,
      ),
      supabaseSelect<ProfileRow[]>(
        `pregnancy_profiles?select=display_name,pregnancy_day_count,pregnancy_week,pregnancy_day_in_week,due_date,onboarding_payload,baby_nickname,notification_time,theme_key&user_id=eq.${userId}&limit=1`,
      ),
    ]);

    if (!users[0]) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const profile = profiles[0] ?? null;
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
      const dayNumber = ((profile.pregnancy_day_in_week ?? 0) % 7) + 1;
      const weekRows = await supabaseSelect<WeekRow[]>(
        `content_pregnancy_week_data?select=id&week_number=eq.${profile.pregnancy_week}&status=eq.published&limit=1`,
      );
      const week = weekRows[0];

      if (week) {
        const [datedQuestions, genericQuestions] = await Promise.all([
          supabaseSelect<QuestionRow[]>(
            `content.week_questions?select=id,code,question_text,question_type,help_text,question_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc`,
          ),
          supabaseSelect<QuestionRow[]>(
            `content.week_questions?select=id,code,question_text,question_type,help_text,question_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc`,
          ),
        ]);

        const questions = [...datedQuestions, ...genericQuestions];
        const questionIds = questions.map((question) => question.id);
        const questionEvents =
          questionIds.length > 0
            ? await supabaseSelect<QuestionEventRow[]>(
                `user_question_events?select=id,question_id,status&user_id=eq.${userId}&question_id=in.(${questionIds.join(",")})`,
              )
            : [];
        const answeredSet = new Set(
          questionEvents
            .filter((event) => event.status === "answered")
            .map((event) => event.question_id),
        );

        pendingSurveys = questions
          .filter((question) => !answeredSet.has(question.id))
          .map((question) => ({
            id: question.id,
            code: question.code,
            questionText: question.question_text,
            questionType: question.question_type,
            helpText: question.help_text,
            choices: resolveQuestionChoices(question),
            answered: false,
          }));
      }
    }

    return NextResponse.json({
      profile: {
        userId: users[0].id,
        displayName: profile?.display_name ?? "사용자",
        phoneNumber: decryptPhoneNumber(users[0].phone_number_encrypted),
        pregnancyWeekLabel: profile?.pregnancy_week
          ? `${profile.pregnancy_week}주 ${profile.pregnancy_day_in_week ?? 0}일`
          : "정보 없음",
        pregnancyDayCount: profile?.pregnancy_day_count ?? 0,
        accountStatus: users[0].account_status,
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
    const notificationTime =
      typeof body.notificationTime === "string"
        ? body.notificationTime.trim()
        : "";
    const themeKey =
      typeof body.themeKey === "string" ? body.themeKey.trim() : "";

    if (!tonePreference) {
      return NextResponse.json(
        { error: "tonePreference is required" },
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
      notificationTime: notificationTime || "08:30",
      themeKey: themeKey || DEFAULT_MOBILE_THEME_KEY,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("mobile profile patch route error", error);
    return mobileRouteErrorResponse(error, "failed to update profile", 400);
  }
}
