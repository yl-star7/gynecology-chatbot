import { NextRequest, NextResponse } from "next/server";
import { requireMobileSession } from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";
import { toRecordDayView } from "@/lib/mobile/serializers";

type CalendarRecordRow = {
  id: string;
  title: string;
  summary: string | null;
  entry_type: string;
  session_id: string | null;
};

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const isoDate = request.nextUrl.searchParams.get("date");

    if (!isoDate) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }
    const { userId } = await requireMobileSession(request, hintedUserId);

    const records = await supabaseSelect<CalendarRecordRow[]>(
      `calendar_logs?select=id,title,summary,entry_type,session_id&user_id=eq.${userId}&date=eq.${isoDate}&order=created_at.desc`,
    );

    const sessionIds = [...new Set(records.map((record) => record.session_id).filter((value): value is string => Boolean(value)))];
    const relatedSessions: SessionRow[] = [];

    for (const sessionId of sessionIds) {
      const sessions = await supabaseSelect<SessionRow[]>(
        `chat_sessions?select=id,title,last_message_at&id=eq.${sessionId}&user_id=eq.${userId}&limit=1`,
      );

      if (sessions[0]) {
        relatedSessions.push(sessions[0]);
      }
    }

    return NextResponse.json({
      recordDay: toRecordDayView({
        isoDate,
        emotionTone: null,
        records,
        relatedSessions,
      }),
    });
  } catch (error) {
    console.error("mobile records route error", error);
    return NextResponse.json({ error: "failed to load day records" }, { status: 500 });
  }
}
