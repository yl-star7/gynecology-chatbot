import { NextRequest, NextResponse } from "next/server";
import { requireMobileSession } from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";
import { toHomeViewData } from "@/lib/mobile/serializers";

function getMonth(raw: string | null) {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    return raw;
  }

  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const hintedUserId = searchParams.get("userId");
    const month = getMonth(searchParams.get("month"));
    const { userId } = await requireMobileSession(request, hintedUserId);

    const [profiles, calendarRows] = await Promise.all([
      supabaseSelect<
        Array<{
          display_name: string | null;
          pregnancy_day_count: number;
          pregnancy_week: number | null;
          pregnancy_day_in_week: number | null;
        }>
      >(
        `pregnancy_profiles?select=display_name,pregnancy_day_count,pregnancy_week,pregnancy_day_in_week&user_id=eq.${userId}&limit=1`,
      ),
      supabaseSelect<Array<{ date: string; summary: string | null }>>(
        `calendar_logs?select=date,summary&user_id=eq.${userId}&date=gte.${month}-01&date=lt.${month}-32`,
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
    return NextResponse.json({ error: "failed to load home" }, { status: 500 });
  }
}
