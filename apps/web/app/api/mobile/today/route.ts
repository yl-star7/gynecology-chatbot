import { NextRequest, NextResponse } from "next/server";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

import {
  mobileNoStoreJson,
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { sanitizeInlineCitationMarkers } from "@/lib/mobile/chat/sanitizers";

type ProfileRow = {
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
  due_date: string | null;
};

function getKstDate(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(
    new Date(),
  );
}

const MAX_PREGNANCY_DAYS = 294;

function calculateCurrentPregnancyWeek(dueDate: string): {
  week: number;
  dayInWeek: number;
  postDue: boolean;
} {
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffDays = Math.round(
    (due.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );
  const pregnancyDayCount = Math.max(
    0,
    Math.min(MAX_PREGNANCY_DAYS, MAX_PREGNANCY_DAYS - diffDays),
  );
  const postDue = diffDays < 0;

  if (postDue) {
    return { week: 40, dayInWeek: 0, postDue: true };
  }

  const rawWeek = Math.floor(pregnancyDayCount / 7);
  const week = Math.max(1, Math.min(42, rawWeek));
  const dayInWeek = pregnancyDayCount % 7;
  return { week, dayInWeek, postDue: false };
}

type WeekRow = {
  id: string;
  baby_summary: string | null;
  mother_summary: string | null;
};

type DayContentRow = {
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

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function formatDateOnly(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function asStringArrayPayload(
  value: Prisma.JsonValue | null | undefined,
): { items?: string[] } | null {
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

export async function GET(request: NextRequest) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);

    const profileRow = await prisma.pregnancy_profiles.findUnique({
      where: { user_id: userId },
      select: {
        pregnancy_week: true,
        pregnancy_day_in_week: true,
        due_date: true,
      },
    });
    const profile: ProfileRow | null = profileRow
      ? {
          pregnancy_week: profileRow.pregnancy_week,
          pregnancy_day_in_week: profileRow.pregnancy_day_in_week,
          due_date: formatDateOnly(profileRow.due_date),
        }
      : null;

    if (!profile?.pregnancy_week && !profile?.due_date) {
      return mobileNoStoreJson({
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
    const weekRow = await prisma.content_pregnancy_week_data.findFirst({
      where: {
        week_number: currentWeek,
        status: "published",
      },
      select: {
        id: true,
        baby_summary: true,
        mother_summary: true,
      },
    });
    const week: WeekRow | null = weekRow;

    if (!week) {
      return mobileNoStoreJson({
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
        prisma.content_pregnancy_day_contents.findFirst({
          where: {
            week_data_id: week.id,
            day_number: dayNumber,
          },
          select: {
            baby_development_payload: true,
            baby_message: true,
            mother_changes_payload: true,
          },
        }),
        prisma.content_week_checklists.findMany({
          where: {
            week_data_id: week.id,
            day_number: dayNumber,
            is_active: true,
          },
          orderBy: { display_order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            display_order: true,
          },
        }),
        prisma.content_week_checklists.findMany({
          where: {
            week_data_id: week.id,
            day_number: null,
            is_active: true,
          },
          orderBy: { display_order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            display_order: true,
          },
        }),
        prisma.calendar_logs.findFirst({
          where: {
            user_id: userId,
            date: parseDateOnly(todayDate),
            entry_type: "today_info_view",
          },
          select: { id: true },
        }),
      ]);

    const day: DayContentRow | null = dayRow
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
      ? await prisma.user_checklist_events.findMany({
          where: {
            user_id: userId,
            checklist_id: { in: checklistIds },
          },
          select: {
            id: true,
            checklist_id: true,
            status: true,
          },
        })
      : [];
    const completedByChecklistId = buildChecklistStatusMap(
      checklistEvents as ChecklistEventRow[],
    );

    return mobileNoStoreJson({
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
    return mobileRouteErrorResponse(error, "failed to load today");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const { userId } = await requireMobileSession(request, hintedUserId);
    const checklistId =
      typeof body.checklistId === "string" ? body.checklistId : "";
    const completed = Boolean(body.completed);
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "view_info") {
      const todayDate = getKstDate();
      const existingInfoRow = await prisma.calendar_logs.findFirst({
        where: {
          user_id: userId,
          date: parseDateOnly(todayDate),
          entry_type: "today_info_view",
        },
        select: { id: true },
      });

      if (!existingInfoRow?.id) {
        await prisma.calendar_logs.create({
          data: {
            user_id: userId,
            date: parseDateOnly(todayDate),
            entry_type: "today_info_view",
            title: "오늘,우리 정보 확인",
            summary: "오늘 아기와 엄마 정보를 확인했어요.",
            payload: { viewedAt: new Date().toISOString() },
          },
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (!checklistId) {
      return NextResponse.json(
        { error: "checklistId is required" },
        { status: 400 },
      );
    }

    const existingEvent = await prisma.user_checklist_events.findFirst({
      where: {
        user_id: userId,
        checklist_id: checklistId,
      },
      select: { id: true },
    });

    const now = new Date();
    const nextStatus = completed ? "completed" : "opened";

    if (existingEvent?.id) {
      await prisma.user_checklist_events.update({
        where: { id: existingEvent.id },
        data: {
          status: nextStatus,
          completed_at: completed ? now : null,
          updated_at: now,
        },
      });
    } else {
      await prisma.user_checklist_events.create({
        data: {
          user_id: userId,
          checklist_id: checklistId,
          status: nextStatus,
          sent_at: now,
          completed_at: completed ? now : null,
          updated_at: now,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mobile today PATCH route error", error);
    return mobileRouteErrorResponse(error, "failed to update checklist item");
  }
}
