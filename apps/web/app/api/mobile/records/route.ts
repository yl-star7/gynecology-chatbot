import { NextRequest, NextResponse } from "next/server";
import type { TodayChecklistItem } from "@gynecology-chatbot/app-core";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";
import { sanitizeInlineCitationMarkers } from "@/lib/mobile/chat/sanitizers";
import {
  resolveRecentChatPreview,
  toRecordDayView,
} from "@/lib/mobile/serializers";

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
  last_message_preview: string | null;
};

type SessionActivityRow = {
  session_id: string;
  last_message_at: string;
};

type MessagePreviewRow = {
  session_id: string;
  plain_text: string | null;
  parts: Array<{
    type?: string;
    text?: string;
    choices?: unknown[] | null;
  }> | null;
};

type ProfileRow = {
  pregnancy_day_count: number | null;
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
  due_date: string | null;
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

type StoredProfileMemory = {
  lastEmotionTone?: EmotionTone | null;
  updatedAt?: string | null;
};
type StoredOnboardingPayload = {
  profileMemory?: StoredProfileMemory | null;
  [key: string]: unknown;
};

const VALID_EMOTION_TONES: EmotionTone[] = [
  "calm",
  "joyful",
  "anxious",
  "tired",
  "sad",
];

const MAX_PREGNANCY_DAYS = 294;
const MIN_PREGNANCY_WEEK = 1;
const MAX_PREGNANCY_WEEK = 42;

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

function calculatePregnancyPositionFromDueDate(
  dueDate: string,
  targetIsoDate: string,
) {
  const diffDays = diffCalendarDays(dueDate, targetIsoDate);
  if (diffDays < 0) {
    return { weekNumber: 40, dayNumber: 1 };
  }

  const pregnancyDayCount = Math.max(
    0,
    Math.min(MAX_PREGNANCY_DAYS, MAX_PREGNANCY_DAYS - diffDays),
  );
  const weekNumber = Math.max(
    MIN_PREGNANCY_WEEK,
    Math.min(MAX_PREGNANCY_WEEK, Math.floor(pregnancyDayCount / 7)),
  );
  const dayNumber = (pregnancyDayCount % 7) + 1;

  return { weekNumber, dayNumber };
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

function resolveSelectedPregnancyPosition(
  profile: ProfileRow,
  isoDate: string,
) {
  if (profile.due_date) {
    return calculatePregnancyPositionFromDueDate(profile.due_date, isoDate);
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

  return {
    weekNumber: Math.ceil(selectedPregnancyDayCount / 7),
    dayNumber: ((selectedPregnancyDayCount - 1) % 7) + 1,
  };
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
    return sanitizeInlineCitationMarkers(title);
  }

  const description = row.description?.trim();
  if (description) {
    return sanitizeInlineCitationMarkers(description);
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

  const chatSummary = records.find(
    (record) =>
      record.entry_type === "chat_saved" &&
      (record.payload?.compactSummary ||
        record.payload?.assistantSummary ||
        record.summary),
  );
  if (chatSummary?.payload?.compactSummary) {
    return String(chatSummary.payload.compactSummary).replace(
      /^현재 단계:\s*/u,
      "",
    );
  }
  if (chatSummary?.summary) {
    return chatSummary.summary;
  }
  if (chatSummary?.payload?.assistantSummary) {
    return String(chatSummary.payload.assistantSummary);
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
    `pregnancy_profiles?select=pregnancy_day_count,pregnancy_week,pregnancy_day_in_week,due_date&user_id=eq.${userId}&limit=1`,
  );
  const profile = profiles[0];
  if (!profile) {
    return [];
  }

  const position = resolveSelectedPregnancyPosition(profile, isoDate);
  if (!position) {
    return [];
  }

  const weeks = await supabaseSelect<WeekRow[]>(
    `content_pregnancy_week_data?select=id&week_number=eq.${position.weekNumber}&status=eq.published&limit=1`,
  );
  const week = weeks[0];
  if (!week) {
    return [];
  }

  const [datedChecklistRows, genericChecklistRows] = await Promise.all([
    supabaseSelect<ChecklistRow[]>(
      `content_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=eq.${position.dayNumber}&is_active=eq.true&order=display_order.asc`,
    ),
    supabaseSelect<ChecklistRow[]>(
      `content_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc`,
    ),
  ]);

  const checklistRows = [...datedChecklistRows, ...genericChecklistRows];
  const checklistIds = checklistRows.map((row) => row.id);
  const checklistEvents = checklistIds.length
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
    `pregnancy_profiles?select=pregnancy_day_count,pregnancy_week,pregnancy_day_in_week,due_date&user_id=eq.${userId}&limit=1`,
  );
  const profile = profiles[0];
  if (!profile) {
    return null;
  }

  const position = resolveSelectedPregnancyPosition(profile, isoDate);
  if (!position) {
    return null;
  }

  const weeks = await supabaseSelect<WeekRow[]>(
    `content_pregnancy_week_data?select=id&week_number=eq.${position.weekNumber}&status=eq.published&limit=1`,
  );
  const week = weeks[0];
  if (!week) {
    return null;
  }

  const [datedQuestions, genericQuestions] = await Promise.all([
    supabaseSelect<QuestionRow[]>(
      `content_week_questions?select=id,question_text,day_number&week_data_id=eq.${week.id}&day_number=eq.${position.dayNumber}&is_active=eq.true&order=display_order.asc&limit=1`,
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

    const explicitSessionIds = records
      .map((record) => record.session_id)
      .filter((value): value is string => Boolean(value));
    const sessionActivityRows = await supabaseSelect<SessionActivityRow[]>(
      `v_chat_session_activity_dates?select=session_id,last_message_at&user_id=eq.${userId}&activity_date=eq.${isoDate}&order=last_message_at.desc`,
    );
    const sessionIds = [
      ...new Set([
        ...explicitSessionIds,
        ...sessionActivityRows.map((row) => row.session_id),
      ]),
    ];
    const relatedSessions =
      sessionIds.length > 0
        ? await supabaseSelect<SessionRow[]>(
            `chat_sessions?select=id,title,last_message_at&id=in.(${sessionIds.join(",")})&user_id=eq.${userId}`,
          )
        : [];
    const latestMessages =
      sessionIds.length > 0
        ? await supabaseSelect<MessagePreviewRow[]>(
            `chat_messages?select=session_id,plain_text,parts&session_id=in.(${sessionIds.join(",")})&order=created_at.desc`,
          )
        : [];
    const previewBySessionId = new Map<string, string>();

    for (const message of latestMessages) {
      if (previewBySessionId.has(message.session_id)) {
        continue;
      }

      const preview = resolveRecentChatPreview({
        plainText: message.plain_text,
        parts: message.parts,
      });
      if (preview) {
        previewBySessionId.set(message.session_id, preview);
      }
    }

    const orderedRelatedSessions: SessionRow[] = [];

    for (const sessionId of sessionIds) {
      const session = relatedSessions.find((item) => item.id === sessionId);
      if (!session) {
        continue;
      }

      orderedRelatedSessions.push({
        ...session,
        last_message_preview: previewBySessionId.get(session.id) ?? null,
      });
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
      orderedRelatedSessions,
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
        relatedSessions: orderedRelatedSessions,
      }),
    });
  } catch (error) {
    console.error("mobile records route error", error);
    return mobileRouteErrorResponse(error, "failed to load day records");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const { userId } = await requireMobileSession(request, hintedUserId);

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

    const profiles = await supabaseSelect<
      Array<{ onboarding_payload: StoredOnboardingPayload | null }>
    >(
      `pregnancy_profiles?select=onboarding_payload&user_id=eq.${userId}&limit=1`,
    );
    const existingOnboardingPayload = profiles[0]?.onboarding_payload ?? {};

    await supabaseInsert("calendar_logs", {
      user_id: userId,
      session_id: sessionId,
      date: today,
      entry_type: "emotion_checkin",
      title: EMOTION_TONE_LABELS[emotionTone as EmotionTone],
      payload: { emotionTone },
    });

    await supabaseUpdate(`pregnancy_profiles?user_id=eq.${userId}`, {
      onboarding_payload: {
        ...existingOnboardingPayload,
        profileMemory: {
          ...(existingOnboardingPayload.profileMemory ?? {}),
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
