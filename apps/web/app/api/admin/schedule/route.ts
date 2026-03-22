import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { supabaseSelect, supabaseInsert, supabaseUpdate } from "@/lib/mobile/supabase-rest";

const SCHEDULE_KEY = "notification_schedule";

const DEFAULT_SCHEDULE = {
  dailyCheckEnabled: true,
  dailyCheckTime: "09:00",
  weeklyMilestoneEnabled: true,
  weeklyMilestoneDay: 1,
  weeklyMilestoneTime: "10:00",
  checkupReminderEnabled: true,
  checkupReminderTime: "18:00",
};

type ScheduleConfig = typeof DEFAULT_SCHEDULE;
type ConfigRow = { key: string; value: ScheduleConfig };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateSchedule(body: Partial<ScheduleConfig>): string | null {
  if (body.dailyCheckTime !== undefined && !TIME_PATTERN.test(body.dailyCheckTime)) {
    return "invalid dailyCheckTime format (HH:MM)";
  }
  if (body.weeklyMilestoneTime !== undefined && !TIME_PATTERN.test(body.weeklyMilestoneTime)) {
    return "invalid weeklyMilestoneTime format (HH:MM)";
  }
  if (body.checkupReminderTime !== undefined && !TIME_PATTERN.test(body.checkupReminderTime)) {
    return "invalid checkupReminderTime format (HH:MM)";
  }
  if (
    body.weeklyMilestoneDay !== undefined &&
    (typeof body.weeklyMilestoneDay !== "number" ||
      body.weeklyMilestoneDay < 0 ||
      body.weeklyMilestoneDay > 6)
  ) {
    return "invalid weeklyMilestoneDay (must be 0-6)";
  }
  return null;
}

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const rows = await supabaseSelect<ConfigRow[]>(
      `system_config?select=key,value&key=eq.${SCHEDULE_KEY}&limit=1`,
    );

    return NextResponse.json(rows[0]?.value ?? DEFAULT_SCHEDULE);
  } catch (error) {
    console.error("admin schedule GET error", error);
    return NextResponse.json({ error: "failed to load schedule" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<ScheduleConfig>;

    const validationError = validateSchedule(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const schedule: ScheduleConfig = { ...DEFAULT_SCHEDULE, ...body };

    const existing = await supabaseSelect<ConfigRow[]>(
      `system_config?select=key&key=eq.${SCHEDULE_KEY}&limit=1`,
    );

    if (existing.length > 0) {
      await supabaseUpdate(`system_config?key=eq.${SCHEDULE_KEY}`, {
        value: schedule,
        updated_at: new Date().toISOString(),
      });
    } else {
      await supabaseInsert("system_config", {
        key: SCHEDULE_KEY,
        value: schedule,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, schedule });
  } catch (error) {
    console.error("admin schedule PUT error", error);
    return NextResponse.json({ error: "failed to save schedule" }, { status: 500 });
  }
}
