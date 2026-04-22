import { Hono } from "hono";
import {
  addCalendarDays,
  createKoreanDateKey,
  createKoreanDateTime,
} from "@gynecology-chatbot/app-core/time";
import { prisma } from "@gynecology-chatbot/db/prisma";

import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

app.get("/analytics", async (c) => {
  try {
    const today = createKoreanDateKey();
    const sevenDaysAgo = addCalendarDays(today, -7);
    const todayStart = createKoreanDateTime({ isoDate: today });
    const sevenDaysAgoStart = createKoreanDateTime({ isoDate: sevenDaysAgo });

    const [
      totalUsers,
      onboardedUsers,
      todaySessions,
      weekMessages,
      todayLogins,
      weekLogins,
      todayEmotions,
      pushEnabled,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.pregnancy_profiles.count(),
      prisma.chat_sessions.count({ where: { created_at: { gte: todayStart } } }),
      prisma.chat_messages.count({
        where: { created_at: { gte: sevenDaysAgoStart } },
      }),
      prisma.user_action_logs.count({
        where: {
          action_type: "login_succeeded",
          occurred_at: { gte: todayStart },
        },
      }),
      prisma.user_action_logs.count({
        where: {
          action_type: "login_succeeded",
          occurred_at: { gte: sevenDaysAgoStart },
        },
      }),
      prisma.calendar_logs.count({
        where: {
          entry_type: "emotion_checkin",
          date: new Date(`${today}T00:00:00.000Z`),
        },
      }),
      prisma.pregnancy_profiles.count({
        where: { push_token: { not: null }, notification_enabled: true },
      }),
    ]);

    const dailyTrend: { date: string; sessions: number; logins: number; messages: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const dayStartKey = addCalendarDays(today, -i);
      const dayEndKey = addCalendarDays(dayStartKey, 1);
      const dayStart = createKoreanDateTime({ isoDate: dayStartKey });
      const dayEnd = createKoreanDateTime({ isoDate: dayEndKey });
      const dateLabel = `${dayStartKey.slice(5, 7)}/${dayStartKey.slice(8, 10)}`;

      const [sessions, logins, messages] = await Promise.all([
        prisma.chat_sessions.count({
          where: { created_at: { gte: dayStart, lt: dayEnd } },
        }),
        prisma.user_action_logs.count({
          where: {
            action_type: "login_succeeded",
            occurred_at: { gte: dayStart, lt: dayEnd },
          },
        }),
        prisma.chat_messages.count({
          where: { created_at: { gte: dayStart, lt: dayEnd } },
        }),
      ]);

      dailyTrend.push({ date: dateLabel, sessions, logins, messages });
    }

    return c.json({
      totalUsers,
      onboardedUsers,
      todaySessions,
      weekMessages,
      todayLogins,
      weekLogins,
      todayEmotions,
      pushEnabled,
      dailyTrend,
    });
  } catch (error) {
    console.error("admin api analytics error", error);
    return c.json(
      { error: error instanceof Error ? error.message : "failed to load analytics" },
      500,
    );
  }
});

export default app;
