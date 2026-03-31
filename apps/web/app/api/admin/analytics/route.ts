import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { supabaseSelect } from "@/lib/supabase/admin-client";

const COUNT_LIMIT = 10000;

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    // Total registered users
    const totalUsersRows = await supabaseSelect<{ id: string }[]>(
      `users?select=id&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Users with completed onboarding (have pregnancy_profiles)
    const onboardedUsersRows = await supabaseSelect<{ user_id: string }[]>(
      `pregnancy_profiles?select=user_id&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Chat sessions created today
    const todaySessionsRows = await supabaseSelect<{ id: string }[]>(
      `chat_sessions?select=id&created_at=gte.${today}T00:00:00Z&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Chat messages in last 7 days
    const weekMessagesRows = await supabaseSelect<{ id: string }[]>(
      `chat_messages?select=id&created_at=gte.${sevenDaysAgo}T00:00:00Z&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Successful logins
    const todayLoginsRows = await supabaseSelect<{ id: string }[]>(
      `user_action_logs?select=id&action_type=eq.login_succeeded&occurred_at=gte.${today}T00:00:00Z&limit=${COUNT_LIMIT}`,
    ).catch(() => []);
    const weekLoginsRows = await supabaseSelect<{ id: string }[]>(
      `user_action_logs?select=id&action_type=eq.login_succeeded&occurred_at=gte.${sevenDaysAgo}T00:00:00Z&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Emotion check-ins today
    const todayEmotionsRows = await supabaseSelect<{ id: string }[]>(
      `calendar_logs?select=id&entry_type=eq.emotion_checkin&date=eq.${today}&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Users with push tokens enabled
    const pushEnabledRows = await supabaseSelect<{ user_id: string }[]>(
      `pregnancy_profiles?select=user_id&push_token=not.is.null&notification_enabled=eq.true&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Daily trend for last 7 days
    const dailyTrend: Array<{
      date: string;
      sessions: number;
      logins: number;
      messages: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(Date.now() - (i - 1) * 24 * 60 * 60 * 1000);
      const dayStartStr = dayStart.toISOString().slice(0, 10);
      const dayEndStr = dayEnd.toISOString().slice(0, 10);
      const dateLabel = `${String(dayStart.getMonth() + 1).padStart(2, "0")}/${String(dayStart.getDate()).padStart(2, "0")}`;

      const [daySessions, dayLogins, dayMessages] = await Promise.all([
        supabaseSelect<{ id: string }[]>(
          `chat_sessions?select=id&created_at=gte.${dayStartStr}T00:00:00Z&created_at=lt.${dayEndStr}T00:00:00Z&limit=${COUNT_LIMIT}`,
        ).catch(() => []),
        supabaseSelect<{ id: string }[]>(
          `user_action_logs?select=id&action_type=eq.login_succeeded&occurred_at=gte.${dayStartStr}T00:00:00Z&occurred_at=lt.${dayEndStr}T00:00:00Z&limit=${COUNT_LIMIT}`,
        ).catch(() => []),
        supabaseSelect<{ id: string }[]>(
          `chat_messages?select=id&created_at=gte.${dayStartStr}T00:00:00Z&created_at=lt.${dayEndStr}T00:00:00Z&limit=${COUNT_LIMIT}`,
        ).catch(() => []),
      ]);

      dailyTrend.push({
        date: dateLabel,
        sessions: daySessions.length,
        logins: dayLogins.length,
        messages: dayMessages.length,
      });
    }

    return NextResponse.json({
      totalUsers: totalUsersRows.length,
      onboardedUsers: onboardedUsersRows.length,
      todaySessions: todaySessionsRows.length,
      weekMessages: weekMessagesRows.length,
      todayLogins: todayLoginsRows.length,
      weekLogins: weekLoginsRows.length,
      todayEmotions: todayEmotionsRows.length,
      pushEnabled: pushEnabledRows.length,
      dailyTrend,
    });
  } catch (error) {
    console.error("admin analytics route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to load analytics",
      },
      { status: 500 },
    );
  }
}
