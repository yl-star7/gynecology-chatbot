import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";
import { toRecordDayView } from "@/lib/mobile/serializers";

type CalendarRecordRow = {
  id: string;
  title: string;
  summary: string | null;
  entry_type: string;
  session_id: string | null;
};

type EmotionRow = {
  date: string;
  emotion_tone: "calm" | "joyful" | "anxious" | "tired" | "sad";
};

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const isoDate = request.nextUrl.searchParams.get("date");

    if (!userId || !isoDate) {
      return NextResponse.json({ error: "userId and date are required" }, { status: 400 });
    }

    const [records, emotions] = await Promise.all([
      supabaseSelect<CalendarRecordRow[]>(
        `calendar_logs?select=id,title,summary,entry_type,session_id&user_id=eq.${userId}&date=eq.${isoDate}&order=created_at.desc`,
      ),
      supabaseSelect<EmotionRow[]>(`emotion_logs?select=date,emotion_tone&user_id=eq.${userId}&date=eq.${isoDate}&limit=1`),
    ]);

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
        emotionTone: emotions[0]?.emotion_tone ?? null,
        records,
        relatedSessions,
      }),
    });
  } catch (error) {
    console.error("mobile records route error", error);
    return NextResponse.json({ error: "failed to load day records" }, { status: 500 });
  }
}
