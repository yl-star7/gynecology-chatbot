import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/supabase/admin-client";
import { toHomeViewData } from "@/lib/mobile/serializers";

type CalendarActivityRow = {
  date: string;
  summary: string | null;
  entry_type: string | null;
};

function isMissingCalendarActivityViewError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("v_user_calendar_activity") &&
    (error.message.includes("schema cache") ||
      error.message.includes("does not exist"))
  );
}

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
    const [profiles] = await Promise.all([
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
    ]);

    let calendarRows: CalendarActivityRow[];
    try {
      calendarRows = await supabaseSelect<CalendarActivityRow[]>(
        `v_user_calendar_activity?select=date,summary,entry_type&user_id=eq.${userId}&date=gte.${month}-01&date=lte.${month}-${String(monthLastDay).padStart(2, "0")}`,
      );
    } catch (error) {
      if (!isMissingCalendarActivityViewError(error)) {
        throw error;
      }

      console.error("mobile home calendar activity fallback", error);
      calendarRows = await supabaseSelect<CalendarActivityRow[]>(
        `calendar_logs?select=date,summary,entry_type&user_id=eq.${userId}&date=gte.${month}-01&date=lte.${month}-${String(monthLastDay).padStart(2, "0")}`,
      );
    }

    const profile = profiles[0] ?? null;

    return NextResponse.json({
      home: toHomeViewData({
        user: { display_name: profile?.display_name ?? "사용자" },
        profile,
        calendarRows,
        month,
      }),
    });
  } catch (error) {
    console.error("mobile home route error", error);
    return mobileRouteErrorResponse(error, "failed to load home");
  }
}
