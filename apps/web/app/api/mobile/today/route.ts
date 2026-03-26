import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseInsert, supabaseSelect, supabaseUpdate } from "@/lib/mobile/supabase-rest";

type ProfileRow = {
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
};

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

function firstText(...values: Array<string | null | undefined>) {
  return (
    values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ??
    ""
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
      `pregnancy_profiles?select=pregnancy_week,pregnancy_day_in_week&user_id=eq.${userId}&limit=1`,
    );
    const profile = profiles[0];

    if (!profile?.pregnancy_week) {
      return NextResponse.json(
        {
          today: {
            babyBody: "오늘 아기의 변화를 준비 중이에요.",
            momBody: "오늘 엄마의 변화를 준비 중이에요.",
            checklistItems: [],
          },
        },
      );
    }

    const dayNumber = ((profile.pregnancy_day_in_week ?? 0) % 7) + 1;
    const weeks = await supabaseSelect<WeekRow[]>(
      `v_pregnancy_week_data?select=id,baby_summary,mother_summary&week_number=eq.${profile.pregnancy_week}&status=eq.published&limit=1`,
    );
    const week = weeks[0];

    if (!week) {
      return NextResponse.json(
        {
          today: {
            babyBody: "오늘 아기의 변화를 준비 중이에요.",
            momBody: "오늘 엄마의 변화를 준비 중이에요.",
            checklistItems: [],
          },
        },
      );
    }

    const [dayRows, datedChecklistRows, genericChecklistRows] = await Promise.all([
      supabaseSelect<DayContentRow[]>(
        `v_pregnancy_day_contents?select=baby_development_payload,baby_message,mother_changes_payload&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&limit=1`,
      ),
      supabaseSelect<ChecklistRow[]>(
        `v_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc`,
      ),
      supabaseSelect<ChecklistRow[]>(
        `v_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc`,
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
    const checklistId = typeof body.checklistId === "string" ? body.checklistId : "";
    const completed = Boolean(body.completed);

    if (!checklistId) {
      return NextResponse.json({ error: "checklistId is required" }, { status: 400 });
    }

    const existingEvents = await supabaseSelect<Array<{ id: string }>>(
      `user_checklist_events?select=id&user_id=eq.${userId}&checklist_id=eq.${checklistId}&limit=1`,
    );

    const now = new Date().toISOString();
    const nextStatus = completed ? "completed" : "opened";

    if (existingEvents[0]?.id) {
      await supabaseUpdate(`user_checklist_events?id=eq.${existingEvents[0].id}`, {
        status: nextStatus,
        completed_at: completed ? now : null,
        updated_at: now,
      });
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
