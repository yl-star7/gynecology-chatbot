import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";

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
  const pregnancyDayCount = 280 - diffDays;
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
  checklist_id: string;
  status: "sent" | "opened" | "completed" | "skipped";
};

type CalendarLogRow = {
  id: string;
};

function firstText(...values: Array<string | null | undefined>) {
  return (
    values
      .find((value) => typeof value === "string" && value.trim().length > 0)
      ?.trim() ?? ""
  );
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

    const profiles = await supabaseSelect<ProfileRow[]>(
      `pregnancy_profiles?select=pregnancy_week,pregnancy_day_in_week,due_date&user_id=eq.${userId}&limit=1`,
    );
    const profile = profiles[0];

    if (!profile?.pregnancy_week && !profile?.due_date) {
      return NextResponse.json({
        today: {
          babyBody: "오늘 아기의 변화를 준비 중이에요.",
          momBody: "오늘 엄마의 변화를 준비 중이에요.",
          checklistItems: [],
        },
      });
    }

    // due_date가 있으면 현재 날짜 기준으로 주차 동적 재계산, 없으면 DB 정적 값 사용
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
    const weeks = await supabaseSelect<WeekRow[]>(
      `v_pregnancy_week_data?select=id,baby_summary,mother_summary&week_number=eq.${currentWeek}&status=eq.published&limit=1`,
    );
    const week = weeks[0];

    if (!week) {
      return NextResponse.json({
        today: {
          babyBody: "오늘 아기의 변화를 준비 중이에요.",
          momBody: "오늘 엄마의 변화를 준비 중이에요.",
          checklistItems: [],
        },
      });
    }

    const todayDate = getKstDate();
    const [dayRows, datedChecklistRows, genericChecklistRows, infoViewRows] =
      await Promise.all([
        supabaseSelect<DayContentRow[]>(
          `v_pregnancy_day_contents?select=baby_development_payload,baby_message,mother_changes_payload&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&limit=1`,
        ),
        supabaseSelect<ChecklistRow[]>(
          `active_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc`,
        ),
        supabaseSelect<ChecklistRow[]>(
          `active_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc`,
        ),
        supabaseSelect<CalendarLogRow[]>(
          `calendar_logs?select=id&user_id=eq.${userId}&date=eq.${todayDate}&entry_type=eq.today_info_view&limit=1`,
        ),
      ]);

    const day = dayRows[0] ?? null;
    const checklistRows = [...datedChecklistRows, ...genericChecklistRows];
    const checklistIds = checklistRows.map((row) => row.id);
    const checklistEvents =
      checklistIds.length > 0
        ? await supabaseSelect<ChecklistEventRow[]>(
            `user_checklist_events?select=checklist_id,status&user_id=eq.${userId}&checklist_id=in.(${checklistIds.join(",")})`,
          )
        : [];
    const completedByChecklistId = buildChecklistStatusMap(checklistEvents);

    return NextResponse.json({
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
        infoViewed: Boolean(infoViewRows[0]?.id),
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
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);
    const body = await request.json();
    const checklistId =
      typeof body.checklistId === "string" ? body.checklistId : "";
    const completed = Boolean(body.completed);
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "view_info") {
      const todayDate = getKstDate();
      const existingInfoRows = await supabaseSelect<Array<{ id: string }>>(
        `calendar_logs?select=id&user_id=eq.${userId}&date=eq.${todayDate}&entry_type=eq.today_info_view&limit=1`,
      );

      if (!existingInfoRows[0]?.id) {
        await supabaseInsert("calendar_logs", {
          user_id: userId,
          date: todayDate,
          entry_type: "today_info_view",
          title: "오늘,우리 정보 확인",
          summary: "오늘 아기와 엄마 정보를 확인했어요.",
          payload: { viewedAt: new Date().toISOString() },
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

    const existingEvents = await supabaseSelect<Array<{ id: string }>>(
      `user_checklist_events?select=id&user_id=eq.${userId}&checklist_id=eq.${checklistId}&limit=1`,
    );

    const now = new Date().toISOString();
    const nextStatus = completed ? "completed" : "opened";

    if (existingEvents[0]?.id) {
      await supabaseUpdate(
        `user_checklist_events?id=eq.${existingEvents[0].id}`,
        {
          status: nextStatus,
          completed_at: completed ? now : null,
          updated_at: now,
        },
      );
    } else {
      await supabaseInsert("user_checklist_events", {
        user_id: userId,
        checklist_id: checklistId,
        status: nextStatus,
        sent_at: now,
        completed_at: completed ? now : null,
        updated_at: now,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mobile today PATCH route error", error);
    return mobileRouteErrorResponse(error, "failed to update checklist item");
  }
}
