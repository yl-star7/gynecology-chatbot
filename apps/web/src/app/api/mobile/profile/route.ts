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
import { supabaseSelect } from "@/lib/mobile/supabase-rest";
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
    const hintedUserId = typeof body.userId === "string" ? body.userId.trim() : "";
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

    if (!displayName || !tonePreference) {
      return NextResponse.json(
        { error: "displayName and tonePreference are required" },
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
