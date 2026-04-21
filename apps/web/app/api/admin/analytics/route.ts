import { NextResponse } from "next/server";
import {
  addCalendarDays,
  createKoreanDateKey,
  createKoreanDateTime,
} from "@gynecology-chatbot/app-core/time";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { dbSelect } from "@/lib/db/admin-client";

const COUNT_LIMIT = 10000;

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const today = createKoreanDateKey();
    const sevenDaysAgo = addCalendarDays(today, -7);
    const todayStart = createKoreanDateTime({ isoDate: today }).toISOString();
    const sevenDaysAgoStart = createKoreanDateTime({
      isoDate: sevenDaysAgo,
    }).toISOString();

    // Total registered users
    const totalUsersRows = await dbSelect<{ id: string }[]>(
      `users?select=id&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Users with completed onboarding (have pregnancy_profiles)
    const onboardedUsersRows = await dbSelect<{ user_id: string }[]>(
      `pregnancy_profiles?select=user_id&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Chat sessions created today
    const todaySessionsRows = await dbSelect<{ id: string }[]>(
      `chat_sessions?select=id&created_at=gte.${todayStart}&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Chat messages in last 7 days
    const weekMessagesRows = await dbSelect<{ id: string }[]>(
      `chat_messages?select=id&created_at=gte.${sevenDaysAgoStart}&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Successful logins
    const todayLoginsRows = await dbSelect<{ id: string }[]>(
      `user_action_logs?select=id&action_type=eq.login_succeeded&occurred_at=gte.${todayStart}&limit=${COUNT_LIMIT}`,
    ).catch(() => []);
    const weekLoginsRows = await dbSelect<{ id: string }[]>(
      `user_action_logs?select=id&action_type=eq.login_succeeded&occurred_at=gte.${sevenDaysAgoStart}&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Emotion check-ins today
    const todayEmotionsRows = await dbSelect<{ id: string }[]>(
      `calendar_logs?select=id&entry_type=eq.emotion_checkin&date=eq.${today}&limit=${COUNT_LIMIT}`,
    ).catch(() => []);

    // Users with push tokens enabled
    const pushEnabledRows = await dbSelect<{ user_id: string }[]>(
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
      const dayStartKey = addCalendarDays(today, -i);
      const dayEndKey = addCalendarDays(dayStartKey, 1);
      const dayStartIso = createKoreanDateTime({
        isoDate: dayStartKey,
      }).toISOString();
      const dayEndIso = createKoreanDateTime({
        isoDate: dayEndKey,
      }).toISOString();
      const dateLabel = `${dayStartKey.slice(5, 7)}/${dayStartKey.slice(8, 10)}`;

      const [daySessions, dayLogins, dayMessages] = await Promise.all([
        dbSelect<{ id: string }[]>(
          `chat_sessions?select=id&created_at=gte.${dayStartIso}&created_at=lt.${dayEndIso}&limit=${COUNT_LIMIT}`,
        ).catch(() => []),
        dbSelect<{ id: string }[]>(
          `user_action_logs?select=id&action_type=eq.login_succeeded&occurred_at=gte.${dayStartIso}&occurred_at=lt.${dayEndIso}&limit=${COUNT_LIMIT}`,
        ).catch(() => []),
        dbSelect<{ id: string }[]>(
          `chat_messages?select=id&created_at=gte.${dayStartIso}&created_at=lt.${dayEndIso}&limit=${COUNT_LIMIT}`,
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
