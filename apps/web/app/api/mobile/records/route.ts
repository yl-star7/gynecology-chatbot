import { NextRequest, NextResponse } from "next/server";
import type { TodayChecklistItem } from "@gynecology-chatbot/app-core";
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
  const profiles = await supabaseSelect<ProfileRow[]>(
    `pregnancy_profiles?select=pregnancy_day_count,pregnancy_week,pregnancy_day_in_week&user_id=eq.${userId}&limit=1`,
  );
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

  const weeks = await supabaseSelect<WeekRow[]>(
    `published_weeks?select=id&week_number=eq.${targetWeekNumber}&limit=1`,
  );
  const week = weeks[0];
  if (!week) {
    return [];
  }

  const [datedChecklistRows, genericChecklistRows] = await Promise.all([
    supabaseSelect<ChecklistRow[]>(
      `content_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=eq.${targetDayNumber}&is_active=eq.true&order=display_order.asc`,
    ),
    supabaseSelect<ChecklistRow[]>(
      `content_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc`,
    ),
  ]);

  const checklistRows = [...datedChecklistRows, ...genericChecklistRows];
  const checklistIds = checklistRows.map((row) => row.id);
  const checklistEvents =
    checklistIds.length > 0
      ? await supabaseSelect<ChecklistEventRow[]>(
          `user_checklist_events?select=checklist_id,status&user_id=eq.${userId}&checklist_id=in.(${checklistIds.join(",")})`,
        )
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
  const profiles = await supabaseSelect<ProfileRow[]>(
    `pregnancy_profiles?select=pregnancy_day_count,pregnancy_week,pregnancy_day_in_week&user_id=eq.${userId}&limit=1`,
  );
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

  const weeks = await supabaseSelect<WeekRow[]>(
    `published_weeks?select=id&week_number=eq.${targetWeekNumber}&limit=1`,
  );
  const week = weeks[0];
  if (!week) {
    return null;
  }

  const [datedQuestions, genericQuestions] = await Promise.all([
    supabaseSelect<QuestionRow[]>(
      `content_week_questions?select=id,question_text,day_number&week_data_id=eq.${week.id}&day_number=eq.${targetDayNumber}&is_active=eq.true&order=display_order.asc&limit=1`,
    ),
    supabaseSelect<QuestionRow[]>(
      `content_week_questions?select=id,question_text,day_number&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc&limit=1`,
    ),
  ]);

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
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const isoDate = request.nextUrl.searchParams.get("date");

    if (!isoDate) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }
    const { userId } = await requireMobileSession(request, hintedUserId);
    const checklistItems = await loadChecklistItems(userId, isoDate);

    const records = await supabaseSelect<CalendarRecordRow[]>(
      `calendar_logs?select=id,title,summary,entry_type,session_id,payload&user_id=eq.${userId}&date=eq.${isoDate}&order=created_at.desc`,
    );

    const sessionIds = [
      ...new Set(
        records
          .map((record) => record.session_id)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const relatedSessions: SessionRow[] = [];

    for (const sessionId of sessionIds) {
      const sessions = await supabaseSelect<SessionRow[]>(
        `chat_sessions?select=id,title,last_message_at&id=eq.${sessionId}&user_id=eq.${userId}&limit=1`,
      );

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
