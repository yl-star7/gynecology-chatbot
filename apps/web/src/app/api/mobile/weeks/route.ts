import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseRpc } from "@/lib/mobile/supabase-rest";

type WeekRow = {
  week_number: number;
  title: string;
  baby_size_label: string | null;
  baby_summary: string | null;
  mother_summary: string | null;
};

export async function GET(request: NextRequest) {
  try {
    await requireMobileSession(request);

    const rows = await supabaseRpc<WeekRow[]>("get_published_weeks", {});

    return NextResponse.json({
      weeks: (rows ?? []).map((row) => ({
        weekNumber: row.week_number,
        title: row.title,
        babySizeLabel: row.baby_size_label,
        babySummary: row.baby_summary,
        motherSummary: row.mother_summary,
      })),
    });
  } catch (error) {
    console.error("mobile weeks route error", error);
    return mobileRouteErrorResponse(error, "failed to load weeks");
  }
}
