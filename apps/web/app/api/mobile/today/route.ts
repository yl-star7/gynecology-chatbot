import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

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
    const client = getSupabaseAdminClient();
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);

    const { data: profiles, error: profileError } = await client
      .from("pregnancy_profiles")
      .select("pregnancy_week,pregnancy_day_in_week,due_date")
      .eq("user_id", userId)
      .limit(1);
    if (profileError) {
      throw profileError;
    }
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
    const { data: weeks, error: weekError } = await client
      .from("content_pregnancy_week_data")
      .select("id,baby_summary,mother_summary")
      .eq("week_number", currentWeek)
      .eq("status", "published")
      .limit(1);
    if (weekError) {
      throw weekError;
    }
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
    const content = client;
    const [
      dayResult,
      datedChecklistResult,
      genericChecklistResult,
      infoViewResult,
    ] = await Promise.all([
      content
        .from("content_pregnancy_day_contents")
        .select("baby_development_payload,baby_message,mother_changes_payload")
        .eq("week_data_id", week.id)
        .eq("day_number", dayNumber)
        .limit(1),
      content
        .from("content_week_checklists")
        .select("id,title,description,display_order")
        .eq("week_data_id", week.id)
        .eq("day_number", dayNumber)
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      content
        .from("content_week_checklists")
        .select("id,title,description,display_order")
        .eq("week_data_id", week.id)
        .is("day_number", null)
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      client
        .from("calendar_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("date", todayDate)
        .eq("entry_type", "today_info_view")
        .limit(1),
    ]);
    if (dayResult.error) throw dayResult.error;
    if (datedChecklistResult.error) throw datedChecklistResult.error;
    if (genericChecklistResult.error) throw genericChecklistResult.error;
    if (infoViewResult.error) throw infoViewResult.error;
    const dayRows = dayResult.data;
    const datedChecklistRows = datedChecklistResult.data;
    const genericChecklistRows = genericChecklistResult.data;
    const infoViewRows = infoViewResult.data;

    const day = dayRows[0] ?? null;
    const checklistRows = [...datedChecklistRows, ...genericChecklistRows];
    const checklistIds = checklistRows.map((row) => row.id);
    const checklistEvents =
      checklistIds.length > 0
        ? ((
            await client
              .from("user_checklist_events")
              .select("checklist_id,status")
              .eq("user_id", userId)
              .in("checklist_id", checklistIds)
          ).data ?? [])
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
    const client = getSupabaseAdminClient();
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);
    const body = await request.json();
    const checklistId =
      typeof body.checklistId === "string" ? body.checklistId : "";
    const completed = Boolean(body.completed);
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "view_info") {
      const todayDate = getKstDate();
      const { data: existingInfoRows, error: existingInfoError } = await client
        .from("calendar_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("date", todayDate)
        .eq("entry_type", "today_info_view")
        .limit(1);
      if (existingInfoError) {
        throw existingInfoError;
      }

      if (!existingInfoRows[0]?.id) {
        const { error: insertInfoError } = await client
          .from("calendar_logs")
          .insert({
            user_id: userId,
            date: todayDate,
            entry_type: "today_info_view",
            title: "오늘,우리 정보 확인",
            summary: "오늘 아기와 엄마 정보를 확인했어요.",
            payload: { viewedAt: new Date().toISOString() },
          });
        if (insertInfoError) {
          throw insertInfoError;
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (!checklistId) {
      return NextResponse.json(
        { error: "checklistId is required" },
        { status: 400 },
      );
    }

    const { data: existingEvents, error: existingEventError } = await client
      .from("user_checklist_events")
      .select("id")
      .eq("user_id", userId)
      .eq("checklist_id", checklistId)
      .limit(1);
    if (existingEventError) {
      throw existingEventError;
    }

    const now = new Date().toISOString();
    const nextStatus = completed ? "completed" : "opened";

    if (existingEvents[0]?.id) {
      const { error: updateError } = await client
        .from("user_checklist_events")
        .update({
          status: nextStatus,
          completed_at: completed ? now : null,
          updated_at: now,
        })
        .eq("id", existingEvents[0].id);
      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await client
        .from("user_checklist_events")
        .insert({
          user_id: userId,
          checklist_id: checklistId,
          status: nextStatus,
          sent_at: now,
          completed_at: completed ? now : null,
          updated_at: now,
        });
      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mobile today PATCH route error", error);
    return mobileRouteErrorResponse(error, "failed to update checklist item");
  }
}
