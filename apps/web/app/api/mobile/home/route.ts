import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/supabase/admin-client";
import { toHomeViewData } from "@/lib/mobile/serializers";

function getMonth(raw: string | null) {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    return raw;
  }

  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getLastDayOfMonth(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  return new Date(year, monthIndex + 1, 0).getDate();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const hintedUserId = searchParams.get("userId");
    const month = getMonth(searchParams.get("month"));
    const { userId } = await requireMobileSession(request, hintedUserId);

    const monthLastDay = getLastDayOfMonth(month);
    const [profiles, calendarRows] = await Promise.all([
      supabaseSelect<
        Array<{
          display_name: string | null;
          pregnancy_day_count: number;
          pregnancy_week: number | null;
          pregnancy_day_in_week: number | null;
          due_date: string | null;
        }>
      >(
        `pregnancy_profiles?select=display_name,pregnancy_day_count,pregnancy_week,pregnancy_day_in_week,due_date&user_id=eq.${userId}&limit=1`,
      ),
      supabaseSelect<
        Array<{
          date: string;
          summary: string | null;
          entry_type: string | null;
        }>
      >(
        `v_user_calendar_activity?select=date,summary,entry_type&user_id=eq.${userId}&date=gte.${month}-01&date=lte.${month}-${String(monthLastDay).padStart(2, "0")}`,
      ),
    ]);

    if (!profiles[0]) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    return NextResponse.json({
      home: toHomeViewData({
        user: { display_name: profiles[0].display_name ?? "사용자" },
        profile: profiles[0] ?? null,
        calendarRows,
        month,
      }),
    });
  } catch (error) {
    console.error("mobile home route error", error);
    return mobileRouteErrorResponse(error, "failed to load home");
  }
}
