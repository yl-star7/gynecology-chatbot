import { Hono } from "hono";
import {
  calculatePregnancyPositionFromDueDate,
  createKoreanDateKey,
} from "@gynecology-chatbot/app-core/time";
import { sanitizeInlineCitationMarkers } from "@gynecology-chatbot/mobile-api/chat/sanitizers";
import {
  dbInsert,
  dbSelect,
  dbUpdate,
} from "@gynecology-chatbot/mobile-api/db/admin-client";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";
import { noStoreJson } from "../../lib/responses.js";

const app = new Hono();

type ProfileRow = {
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
  due_date: string | null;
};

function getKstDate(): string {
  return createKoreanDateKey();
}

function calculateCurrentPregnancyWeek(dueDate: string): {
  week: number;
  dayInWeek: number;
  postDue: boolean;
} {
  const position = calculatePregnancyPositionFromDueDate(dueDate, getKstDate());
  return {
    week: position.weekNumber,
    dayInWeek: position.dayNumber - 1,
    postDue: position.postDue,
  };
}

type WeekRow = {
  id: string;
  baby_summary: string | null;
  mother_summary: string | null;
};

type DayContentRow = {
  baby_development_payload: unknown;
  baby_message: string | null;
  mother_changes_payload: unknown;
};

type NormalizedDayContent = {
  baby_development_payload: { items?: string[] } | null;
  baby_message: string | null;
  mother_changes_payload: { items?: string[] } | null;
};

type ChecklistRow = {
  id: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
};

type ChecklistEventRow = {
  id: string;
  checklist_id: string;
  status: "sent" | "opened" | "completed" | "skipped";
};

function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function asStringArrayPayload(value: unknown): { items?: string[] } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as { items?: unknown };
  return {
    items: Array.isArray(record.items)
      ? record.items.filter((item): item is string => typeof item === "string")
      : undefined,
  };
}

function firstText(...values: Array<string | null | undefined>) {
  const value = values.find(
    (candidate) => typeof candidate === "string" && candidate.trim().length > 0,
  );
  return value ? sanitizeInlineCitationMarkers(value.trim()) : "";
}

function buildChecklistStatusMap(events: ChecklistEventRow[]) {
  return events.reduce<Record<string, boolean>>((map, event) => {
    if (event.status === "completed") {
      map[event.checklist_id] = true;
    }
    return map;
  }, {});
}

app.get("/", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const { userId } = await requireMobileSession(c, hintedUserId);

    const profileRow = (
      await dbSelect<ProfileRow[]>(
        `pregnancy_profiles?select=pregnancy_week,pregnancy_day_in_week,due_date&user_id=eq.${userId}&limit=1`,
      )
    )[0];
    const profile: ProfileRow | null = profileRow
      ? {
          pregnancy_week: profileRow.pregnancy_week,
          pregnancy_day_in_week: profileRow.pregnancy_day_in_week,
          due_date: formatDateOnly(profileRow.due_date),
        }
      : null;

    if (!profile?.pregnancy_week && !profile?.due_date) {
      return noStoreJson(c, {
        today: {
          babyBody: "오늘 아기의 변화를 준비 중이에요.",
          momBody: "오늘 엄마의 변화를 준비 중이에요.",
          checklistItems: [],
        },
      });
    }

    let currentWeek: number;
    let currentDayInWeek: number;
    let postDue = false;

    if (profile.due_date) {
      const metrics = calculateCurrentPregnancyWeek(profile.due_date);
      currentWeek = metrics.week;
      currentDayInWeek = metrics.dayInWeek;
      postDue = metrics.postDue;
    } else {
      currentWeek = Math.max(1, Math.min(42, profile.pregnancy_week ?? 1));
      currentDayInWeek = profile.pregnancy_day_in_week ?? 0;
    }

    const dayNumber = (currentDayInWeek % 7) + 1;
    const weekRow = (
      await dbSelect<WeekRow[]>(
        `content_pregnancy_week_data?select=id,baby_summary,mother_summary&week_number=eq.${currentWeek}&status=eq.published&limit=1`,
      )
    )[0];
    const week: WeekRow | null = weekRow;

    if (!week) {
      return noStoreJson(c, {
        today: {
          babyBody: "오늘 아기의 변화를 준비 중이에요.",
          momBody: "오늘 엄마의 변화를 준비 중이에요.",
          checklistItems: [],
        },
      });
    }

    const todayDate = getKstDate();
    const [dayRow, datedChecklistRows, genericChecklistRows, infoViewRow] =
      await Promise.all([
        dbSelect<DayContentRow[]>(
          `content_pregnancy_day_contents?select=baby_development_payload,baby_message,mother_changes_payload&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&limit=1`,
        ).then((rows) => rows[0] ?? null),
        dbSelect<ChecklistRow[]>(
          `content_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc`,
        ),
        dbSelect<ChecklistRow[]>(
          `content_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc`,
        ),
        dbSelect<Array<{ id: string }>>(
          `calendar_logs?select=id&user_id=eq.${userId}&date=eq.${todayDate}&entry_type=eq.today_info_view&limit=1`,
        ).then((rows) => rows[0] ?? null),
      ]);

    const day: NormalizedDayContent | null = dayRow
      ? {
          baby_development_payload: asStringArrayPayload(
            dayRow.baby_development_payload,
          ),
          baby_message: dayRow.baby_message,
          mother_changes_payload: asStringArrayPayload(
            dayRow.mother_changes_payload,
          ),
        }
      : null;
    const checklistRows = [...datedChecklistRows, ...genericChecklistRows];
    const checklistIds = checklistRows.map((row) => row.id);
    const checklistEvents = checklistIds.length
      ? await dbSelect<ChecklistEventRow[]>(
          `user_checklist_events?select=id,checklist_id,status&user_id=eq.${userId}&checklist_id=in.(${checklistIds.join(",")})`,
        )
      : [];
    const completedByChecklistId = buildChecklistStatusMap(checklistEvents);

    return noStoreJson(c, {
      today: {
        babyBody: firstText(
          day?.baby_message,
          day?.baby_development_payload?.items?.[0],
          week.baby_summary,
          "오늘 아기의 변화를 준비 중이에요.",
        ),
        momBody: firstText(
          day?.mother_changes_payload?.items?.[0],
          week.mother_summary,
          "오늘 엄마의 변화를 준비 중이에요.",
        ),
        infoViewed: Boolean(infoViewRow?.id),
        postDue,
        checklistItems: checklistRows.map((row) => ({
          id: row.id,
          label: firstText(row.title, row.description, "오늘의 체크리스트"),
          completed: completedByChecklistId[row.id] ?? false,
        })),
      },
    });
  } catch (error) {
    console.error("mobile today route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load today");
  }
});

app.patch("/", async (c) => {
  try {
    const body = await c.req.json();
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const { userId } = await requireMobileSession(c, hintedUserId);
    const checklistId =
      typeof body.checklistId === "string" ? body.checklistId : "";
    const completed = Boolean(body.completed);
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "view_info") {
      const todayDate = getKstDate();
      const existingInfoRow = (
        await dbSelect<Array<{ id: string }>>(
          `calendar_logs?select=id&user_id=eq.${userId}&date=eq.${todayDate}&entry_type=eq.today_info_view&limit=1`,
        )
      )[0];

      if (!existingInfoRow?.id) {
        await dbInsert("calendar_logs", {
          user_id: userId,
          date: todayDate,
          entry_type: "today_info_view",
          title: "오늘,우리 정보 확인",
          summary: "오늘 아기와 엄마 정보를 확인했어요.",
          payload: { viewedAt: new Date().toISOString() },
        });
      }

      return c.json({ ok: true });
    }

    if (!checklistId) {
      return c.json({ error: "checklistId is required" }, 400);
    }

    const existingEvent = (
      await dbSelect<Array<{ id: string }>>(
        `user_checklist_events?select=id&user_id=eq.${userId}&checklist_id=eq.${checklistId}&limit=1`,
      )
    )[0];

    const now = new Date().toISOString();
    const nextStatus = completed ? "completed" : "opened";

    if (existingEvent?.id) {
      await dbUpdate(`user_checklist_events?id=eq.${existingEvent.id}`, {
        status: nextStatus,
        completed_at: completed ? now : null,
        updated_at: now,
      });
    } else {
      await dbInsert("user_checklist_events", {
        user_id: userId,
        checklist_id: checklistId,
        status: nextStatus,
        sent_at: now,
        completed_at: completed ? now : null,
        updated_at: now,
      });
    }

    return c.json({ ok: true });
  } catch (error) {
    console.error("mobile today PATCH route error", error);
    return mobileRouteErrorResponse(
      c,
      error,
      "failed to update checklist item",
    );
  }
});

export default app;
