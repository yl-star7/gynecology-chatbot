import { NextRequest, NextResponse } from "next/server";
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
    const userId = searchParams.get("userId");
    const month = getMonth(searchParams.get("month"));

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const [users, profiles, calendarRows, emotionRows] = await Promise.all([
      supabaseSelect<Array<{ display_name: string }>>(`users?select=display_name&id=eq.${userId}&limit=1`),
      supabaseSelect<Array<{ pregnancy_day_count: number; pregnancy_week: number | null; pregnancy_day_in_week: number | null }>>(
        `pregnancy_profiles?select=pregnancy_day_count,pregnancy_week,pregnancy_day_in_week&user_id=eq.${userId}&limit=1`,
      ),
      supabaseSelect<Array<{ date: string; summary: string | null }>>(
        `calendar_logs?select=date,summary&user_id=eq.${userId}&date=gte.${month}-01&date=lt.${month}-32`,
      ),
      supabaseSelect<Array<{ date: string; emotion_tone: "calm" | "joyful" | "anxious" | "tired" | "sad" }>>(
        `emotion_logs?select=date,emotion_tone&user_id=eq.${userId}&date=gte.${month}-01&date=lt.${month}-32`,
      ),
    ]);

    if (!users[0]) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    return NextResponse.json({
      home: toHomeViewData({
        user: users[0],
        profile: profiles[0] ?? null,
        calendarRows,
        emotionRows,
        month,
      }),
    });
  } catch (error) {
    console.error("mobile home route error", error);
    return NextResponse.json({ error: "failed to load home" }, { status: 500 });
  }
}
