import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseInsert, supabaseSelect } from "@/lib/mobile/supabase-rest";
import { toRecordDayView } from "@/lib/mobile/serializers";

type CalendarRecordRow = {
  id: string;
  title: string;
  summary: string | null;
  entry_type: string;
  session_id: string | null;
  payload: { emotionTone?: string } | null;
};

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
};

type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

const VALID_EMOTION_TONES: EmotionTone[] = ["calm", "joyful", "anxious", "tired", "sad"];

const EMOTION_TONE_LABELS: Record<EmotionTone, string> = {
  calm: "차분함",
  joyful: "기쁨",
  anxious: "불안함",
  tired: "피곤함",
  sad: "슬픔",
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
      `calendar_logs?select=id,title,summary,entry_type,session_id,payload&user_id=eq.${userId}&date=eq.${isoDate}&order=created_at.desc`,
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

    const emotionCheckinRow = records.find((record) => record.entry_type === "emotion_checkin");
    const rawTone = emotionCheckinRow?.payload?.emotionTone ?? null;
    const resolvedEmotionTone = rawTone && VALID_EMOTION_TONES.includes(rawTone as EmotionTone)
      ? (rawTone as EmotionTone)
      : null;

    return NextResponse.json({
      recordDay: toRecordDayView({
        isoDate,
        emotionTone: resolvedEmotionTone,
        records,
        relatedSessions,
      }),
    });
  } catch (error) {
    console.error("mobile records route error", error);
    return mobileRouteErrorResponse(error, "failed to load day records");
  }
}

export async function POST(request: NextRequest) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);

    const body = await request.json();
    const { sessionId, emotionTone } = body as { sessionId: string; emotionTone: string };

    if (!VALID_EMOTION_TONES.includes(emotionTone as EmotionTone)) {
      return NextResponse.json(
        { error: "emotionTone must be one of: calm, joyful, anxious, tired, sad" },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    await supabaseInsert("calendar_logs", {
      user_id: userId,
      session_id: sessionId,
      date: today,
      entry_type: "emotion_checkin",
      title: EMOTION_TONE_LABELS[emotionTone as EmotionTone],
      payload: { emotionTone },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mobile records POST route error", error);
    return mobileRouteErrorResponse(error, "failed to save emotion checkin");
  }
}
