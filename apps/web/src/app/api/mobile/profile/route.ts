import { NextRequest, NextResponse } from "next/server";
import { updateMobileProfile } from "@/lib/mobile/auth";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";

type UserRow = {
  id: string;
  display_name: string;
  phone_number: string;
  account_status: string;
};

type ProfileRow = {
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
  } | null;
};

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const [users, profiles] = await Promise.all([
      supabaseSelect<UserRow[]>(`users?select=id,display_name,phone_number,account_status&id=eq.${userId}&limit=1`),
      supabaseSelect<ProfileRow[]>(
        `pregnancy_profiles?select=pregnancy_day_count,pregnancy_week,pregnancy_day_in_week,due_date,onboarding_payload&user_id=eq.${userId}&limit=1`,
      ),
    ]);

    if (!users[0]) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const profile = profiles[0] ?? null;

    return NextResponse.json({
      profile: {
        userId: users[0].id,
        displayName: users[0].display_name,
        phoneNumber: users[0].phone_number,
        pregnancyWeekLabel: profile?.pregnancy_week ? `${profile.pregnancy_week}주 ${profile.pregnancy_day_in_week ?? 0}일` : "정보 없음",
        pregnancyDayCount: profile?.pregnancy_day_count ?? 0,
        accountStatus: users[0].account_status,
        hasCompletedOnboarding: Boolean(profile),
        dueDate: profile?.due_date ?? null,
        tonePreference: profile?.onboarding_payload?.tonePreference ?? null,
        pregnancyWeekOrDueDate: profile?.onboarding_payload?.pregnancyWeekOrDueDate ?? null,
        babyNickname: profile?.onboarding_payload?.babyNickname ?? null,
        hospitalName: profile?.onboarding_payload?.hospitalName ?? null,
        notificationTime: profile?.onboarding_payload?.notificationTime ?? "08:30",
      },
    });
  } catch (error) {
    console.error("mobile profile route error", error);
    return NextResponse.json({ error: "failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
    const tonePreference = typeof body.tonePreference === "string" ? body.tonePreference.trim() : "";
    const babyNickname = typeof body.babyNickname === "string" ? body.babyNickname.trim() : "";
    const hospitalName = typeof body.hospitalName === "string" ? body.hospitalName.trim() : "";
    const notificationTime = typeof body.notificationTime === "string" ? body.notificationTime.trim() : "";

    if (!userId || !displayName || !tonePreference) {
      return NextResponse.json({ error: "userId, displayName, and tonePreference are required" }, { status: 400 });
    }

    const user = await updateMobileProfile({
      userId,
      displayName,
      dueDate: dueDate || null,
      tonePreference,
      babyNickname: babyNickname || null,
      hospitalName: hospitalName || null,
      notificationTime: notificationTime || "08:30",
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("mobile profile patch route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to update profile" }, { status: 400 });
  }
}
