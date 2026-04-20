import { Hono } from "hono";
import { prisma } from "@gynecology-chatbot/db/prisma";
import { toHomeViewData } from "@gynecology-chatbot/mobile-api/serializers";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";
import { noStoreJson } from "../../lib/responses.js";

const app = new Hono();

type CalendarActivityRow = {
  date: string;
  summary: string | null;
  entry_type: string | null;
};

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

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function formatDateOnly(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

app.get("/", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const month = getMonth(c.req.query("month") ?? null);
    const { userId } = await requireMobileSession(c, hintedUserId);

    const monthLastDay = getLastDayOfMonth(month);
    const monthStart = `${month}-01`;
    const monthEnd = `${month}-${String(monthLastDay).padStart(2, "0")}`;

    const [profile, calendarRows] = await Promise.all([
      prisma.pregnancy_profiles.findUnique({
        where: { user_id: userId },
        select: {
          display_name: true,
          pregnancy_day_count: true,
          pregnancy_week: true,
          pregnancy_day_in_week: true,
          due_date: true,
        },
      }),
      prisma.v_user_calendar_activity.findMany({
        where: {
          user_id: userId,
          date: {
            gte: parseDateOnly(monthStart),
            lte: parseDateOnly(monthEnd),
          },
        },
        select: {
          date: true,
          summary: true,
          entry_type: true,
        },
      }),
    ]);

    return noStoreJson(c, {
      home: toHomeViewData({
        user: { display_name: profile?.display_name ?? "사용자" },
        profile: profile
          ? {
              pregnancy_day_count: profile.pregnancy_day_count,
              pregnancy_week: profile.pregnancy_week,
              pregnancy_day_in_week: profile.pregnancy_day_in_week,
              due_date: profile.due_date
                ? profile.due_date.toISOString().slice(0, 10)
                : null,
            }
          : null,
        calendarRows: calendarRows.map(
          (row): CalendarActivityRow => ({
            date: formatDateOnly(row.date),
            summary: row.summary,
            entry_type: row.entry_type,
          }),
        ),
        month,
      }),
    });
  } catch (error) {
    console.error("mobile home route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load home");
  }
});

export default app;
