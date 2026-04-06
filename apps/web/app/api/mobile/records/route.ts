import { NextRequest, NextResponse } from "next/server";
import type { TodayChecklistItem } from "@gynecology-chatbot/app-core";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import {
  getSupabaseAdminClient,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";
import { toRecordDayView } from "@/lib/mobile/serializers";

type CalendarRecordRow = {
  id: string;
  title: string;
  summary: string | null;
  entry_type: string;
  session_id: string | null;
  payload: {
    emotionTone?: string;
    questionId?: string;
    answer?: string;
    viewedAt?: string;
  } | null;
};

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
};

type ProfileRow = {
  pregnancy_day_count: number | null;
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
};

type WeekRow = {
  id: string;
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

type QuestionRow = {
  id: string;
  question_text: string;
  day_number: number | null;
};

type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

const VALID_EMOTION_TONES: EmotionTone[] = [
  "calm",
  "joyful",
  "anxious",
  "tired",
  "sad",
];

const EMOTION_TONE_LABELS: Record<EmotionTone, string> = {
  calm: "차분함",
  joyful: "기쁨",
  anxious: "불안함",
  tired: "피곤함",
  sad: "슬픔",
};

function getKstDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function diffCalendarDays(targetIsoDate: string, baseIsoDate: string) {
  const [targetYear, targetMonth, targetDay] = targetIsoDate
    .split("-")
    .map(Number);
  const [baseYear, baseMonth, baseDay] = baseIsoDate.split("-").map(Number);
  const target = Date.UTC(targetYear, targetMonth - 1, targetDay);
  const base = Date.UTC(baseYear, baseMonth - 1, baseDay);
  return Math.round((target - base) / 86_400_000);
}

function resolveCurrentPregnancyDayCount(profile: ProfileRow) {
  if (
    typeof profile.pregnancy_day_count === "number" &&
    profile.pregnancy_day_count > 0
  ) {
    return profile.pregnancy_day_count;
  }

  if (
    typeof profile.pregnancy_week === "number" &&
    typeof profile.pregnancy_day_in_week === "number"
  ) {
    return (profile.pregnancy_week - 1) * 7 + profile.pregnancy_day_in_week;
  }

  return null;
}

function buildChecklistStatusMap(events: ChecklistEventRow[]) {
  return events.reduce<Record<string, boolean>>((map, event) => {
    if (event.status === "completed") {
      map[event.checklist_id] = true;
    }
    return map;
  }, {});
}

function buildChecklistLabel(row: ChecklistRow) {
  const title = row.title?.trim();
  if (title) {
    return title;
  }

  const description = row.description?.trim();
  if (description) {
    return description;
  }

  return "그날의 체크리스트";
}

function buildConversationSummary(
  records: CalendarRecordRow[],
  relatedSessions: SessionRow[],
) {
  const aiSummary = records.find(
    (record) => record.entry_type === "ai_summary",
  );
  if (aiSummary?.summary) {
    return aiSummary.summary;
  }

  if (relatedSessions.length === 0) {
    return null;
  }

  return `${relatedSessions.length}개의 대화가 있었어요. 하루 요약은 다음날 정리해 보여드릴게요.`;
}

async function loadChecklistItems(
  userId: string,
  isoDate: string,
): Promise<TodayChecklistItem[]> {
  const client = getSupabaseAdminClient();
  const { data: profiles, error: profileError } = await client
    .from("pregnancy_profiles")
    .select("pregnancy_day_count,pregnancy_week,pregnancy_day_in_week")
    .eq("user_id", userId)
    .limit(1);
  if (profileError) {
    throw profileError;
  }
  const profile = profiles[0];
  if (!profile) {
    return [];
  }

  const currentPregnancyDayCount = resolveCurrentPregnancyDayCount(profile);
  if (!currentPregnancyDayCount) {
    return [];
  }

  const dayOffset = diffCalendarDays(isoDate, getKstDateKey());
  const selectedPregnancyDayCount = currentPregnancyDayCount + dayOffset;
  if (selectedPregnancyDayCount <= 0) {
    return [];
  }

  const targetWeekNumber = Math.ceil(selectedPregnancyDayCount / 7);
  const targetDayNumber = ((selectedPregnancyDayCount - 1) % 7) + 1;

  const { data: weeks, error: weekError } = await client
    .from("content_pregnancy_week_data")
    .select("id")
    .eq("week_number", targetWeekNumber)
    .eq("status", "published")
    .limit(1);
  if (weekError) {
    throw weekError;
  }
  const week = weeks[0];
  if (!week) {
    return [];
  }

  const content = client;
  const [datedChecklistResult, genericChecklistResult] = await Promise.all([
    content
      .from("content_week_checklists")
      .select("id,title,description,display_order")
      .eq("week_data_id", week.id)
      .eq("day_number", targetDayNumber)
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    content
      .from("content_week_checklists")
      .select("id,title,description,display_order")
      .eq("week_data_id", week.id)
      .is("day_number", null)
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);
  if (datedChecklistResult.error) throw datedChecklistResult.error;
  if (genericChecklistResult.error) throw genericChecklistResult.error;
  const datedChecklistRows = datedChecklistResult.data;
  const genericChecklistRows = genericChecklistResult.data;

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

  return checklistRows.map((row) => ({
    id: row.id,
    label: buildChecklistLabel(row),
    completed: completedByChecklistId[row.id] ?? false,
  }));
}

async function loadDailyQuestion(
  userId: string,
  isoDate: string,
  records: CalendarRecordRow[],
) {
  const client = getSupabaseAdminClient();
  const { data: profiles, error: profileError } = await client
    .from("pregnancy_profiles")
    .select("pregnancy_day_count,pregnancy_week,pregnancy_day_in_week")
    .eq("user_id", userId)
    .limit(1);
  if (profileError) {
    throw profileError;
  }
  const profile = profiles[0];
  if (!profile) {
    return null;
  }

  const currentPregnancyDayCount = resolveCurrentPregnancyDayCount(profile);
  if (!currentPregnancyDayCount) {
    return null;
  }

  const dayOffset = diffCalendarDays(isoDate, getKstDateKey());
  const selectedPregnancyDayCount = currentPregnancyDayCount + dayOffset;
  if (selectedPregnancyDayCount <= 0) {
    return null;
  }

  const targetWeekNumber = Math.ceil(selectedPregnancyDayCount / 7);
  const targetDayNumber = ((selectedPregnancyDayCount - 1) % 7) + 1;

  const { data: weeks, error: weekError } = await client
    .from("content_pregnancy_week_data")
    .select("id")
    .eq("week_number", targetWeekNumber)
    .eq("status", "published")
    .limit(1);
  if (weekError) {
    throw weekError;
  }
  const week = weeks[0];
  if (!week) {
    return null;
  }

  const content = client;
  const [datedQuestionResult, genericQuestionResult] = await Promise.all([
    content
      .from("content_week_questions")
      .select("id,question_text,day_number")
      .eq("week_data_id", week.id)
      .eq("day_number", targetDayNumber)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(1),
    content
      .from("content_week_questions")
      .select("id,question_text,day_number")
      .eq("week_data_id", week.id)
      .is("day_number", null)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(1),
  ]);
  if (datedQuestionResult.error) throw datedQuestionResult.error;
  if (genericQuestionResult.error) throw genericQuestionResult.error;
  const datedQuestions = datedQuestionResult.data;
  const genericQuestions = genericQuestionResult.data;

  const question = datedQuestions[0] ?? genericQuestions[0] ?? null;
  if (!question) {
    return null;
  }

  const latestAnswer = records.find(
    (record) =>
      record.entry_type === "survey_response" &&
      record.payload?.questionId === question.id,
  );
  const aiSummary = records.find(
    (record) => record.entry_type === "ai_summary",
  );

  return {
    question: question.question_text,
    answer: latestAnswer?.summary ?? latestAnswer?.payload?.answer ?? null,
    aiSummary: aiSummary?.summary ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseAdminClient();
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const isoDate = request.nextUrl.searchParams.get("date");

    if (!isoDate) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }
    const { userId } = await requireMobileSession(request, hintedUserId);
    const checklistItems = await loadChecklistItems(userId, isoDate);

    const { data: records, error: recordError } = await client
      .from("calendar_logs")
      .select("id,title,summary,entry_type,session_id,payload")
      .eq("user_id", userId)
      .eq("date", isoDate)
      .order("created_at", { ascending: false });
    if (recordError) {
      throw recordError;
    }

    const sessionIds = [
      ...new Set(
        records
          .map((record) => record.session_id)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const relatedSessions: SessionRow[] = [];

    for (const sessionId of sessionIds) {
      const { data: sessions, error: sessionError } = await client
        .from("chat_sessions")
        .select("id,title,last_message_at")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .limit(1);
      if (sessionError) {
        throw sessionError;
      }

      if (sessions[0]) {
        relatedSessions.push(sessions[0]);
      }
    }

    const emotionCheckinRow = records.find(
      (record) => record.entry_type === "emotion_checkin",
    );
    const infoViewed = records.some(
      (record) => record.entry_type === "today_info_view",
    );
    const rawTone = emotionCheckinRow?.payload?.emotionTone ?? null;
    const resolvedEmotionTone =
      rawTone && VALID_EMOTION_TONES.includes(rawTone as EmotionTone)
        ? (rawTone as EmotionTone)
        : null;
    const conversationSummary = buildConversationSummary(
      records,
      relatedSessions,
    );
    const dailyQuestion = await loadDailyQuestion(userId, isoDate, records);

    return NextResponse.json({
      recordDay: toRecordDayView({
        isoDate,
        infoViewed,
        emotionTone: resolvedEmotionTone,
        checklistItems,
        conversationSummary,
        dailyQuestion,
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
    const client = getSupabaseAdminClient();
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);

    const body = await request.json();
    const { sessionId, emotionTone } = body as {
      sessionId: string;
      emotionTone: string;
    };

    if (!VALID_EMOTION_TONES.includes(emotionTone as EmotionTone)) {
      return NextResponse.json(
        {
          error:
            "emotionTone must be one of: calm, joyful, anxious, tired, sad",
        },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const now = new Date().toISOString();

    const { error: insertError } = await client.from("calendar_logs").insert({
      user_id: userId,
      session_id: sessionId,
      date: today,
      entry_type: "emotion_checkin",
      title: EMOTION_TONE_LABELS[emotionTone as EmotionTone],
      payload: { emotionTone },
    });
    if (insertError) {
      throw insertError;
    }

    await supabaseUpdate(`pregnancy_profiles?user_id=eq.${userId}`, {
      onboarding_payload: {
        profileMemory: {
          lastEmotionTone: emotionTone,
          updatedAt: now,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mobile records POST route error", error);
    return mobileRouteErrorResponse(error, "failed to save emotion checkin");
  }
}
