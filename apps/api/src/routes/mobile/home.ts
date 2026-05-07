import { Hono } from "hono";
import {
  getPublishedHomeCopyItems,
  HOME_COPY_CONFIG_KEY,
} from "@gynecology-chatbot/app-core";
import {
  createKoreanDateKey,
  createKoreanMonthKey,
} from "@gynecology-chatbot/app-core/time";
import { dbSelect } from "@gynecology-chatbot/mobile-api/db/admin-client";
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

type ProfileRow = {
  display_name: string | null;
  pregnancy_day_count: number;
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
  due_date: string | null;
};

type HomeCopyConfigRow = {
  value: unknown;
};

function getMonth(raw: string | null) {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    return raw;
  }

  return createKoreanMonthKey();
}

function getLastDayOfMonth(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function shouldDeferTodaySessionSummary(row: {
  date: Date | string | null;
  entry_type: string | null;
}) {
  const entryType = row.entry_type ?? "";
  return (
    formatDateOnly(row.date) === createKoreanDateKey() &&
    ["chat", "chat_saved", "ai_summary"].includes(entryType)
  );
}

app.get("/", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const month = getMonth(c.req.query("month") ?? null);
    const { userId } = await requireMobileSession(c, hintedUserId);

    const monthLastDay = getLastDayOfMonth(month);
    const monthStart = `${month}-01`;
    const monthEnd = `${month}-${String(monthLastDay).padStart(2, "0")}`;

    const [profileRows, calendarRows, homeCopyConfigRows] = await Promise.all([
      dbSelect<ProfileRow[]>(
        `pregnancy_profiles?select=display_name,pregnancy_day_count,pregnancy_week,pregnancy_day_in_week,due_date&user_id=eq.${userId}&limit=1`,
      ),
      dbSelect<CalendarActivityRow[]>(
        `calendar_logs?select=date,summary,entry_type&user_id=eq.${userId}&date=gte.${monthStart}&date=lte.${monthEnd}&order=created_at.desc`,
      ),
      dbSelect<HomeCopyConfigRow[]>(
        `system_config?select=value&key=eq.${HOME_COPY_CONFIG_KEY}&limit=1`,
      ),
    ]);
    const profile = profileRows[0] ?? null;
    const homeCopyConfig = homeCopyConfigRows[0] ?? null;

    return noStoreJson(c, {
      home: toHomeViewData({
        user: { display_name: profile?.display_name ?? "사용자" },
        profile: profile
          ? {
              pregnancy_day_count: profile.pregnancy_day_count,
              pregnancy_week: profile.pregnancy_week,
              pregnancy_day_in_week: profile.pregnancy_day_in_week,
              due_date: formatDateOnly(profile.due_date) || null,
            }
          : null,
        calendarRows: calendarRows.map(
          (row): CalendarActivityRow => ({
            date: formatDateOnly(row.date),
            summary: shouldDeferTodaySessionSummary(row) ? null : row.summary,
            entry_type: row.entry_type,
          }),
        ),
        month,
        homeCopyItems: getPublishedHomeCopyItems(homeCopyConfig?.value),
      }),
    });
  } catch (error) {
    console.error("mobile home route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load home");
  }
});

export default app;
