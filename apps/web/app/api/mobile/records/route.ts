import { NextRequest, NextResponse } from "next/server";
import type { TodayChecklistItem } from "@gynecology-chatbot/app-core";
import {
  createKoreanDateKey,
  resolvePregnancyPositionFromProfile,
} from "@gynecology-chatbot/app-core/time";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { sanitizeInlineCitationMarkers } from "@/lib/mobile/chat/sanitizers";
import { buildDailyQuestionSummaries } from "@gynecology-chatbot/mobile-api/record-day-questions";
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
    compactSummary?: string | null;
    assistantSummary?: string | null;
    lastMessageAt?: string;
    source?: string;
    question?: string;
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

type WeekRow = { id: string };

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

const EMOTION_TONE_LABELS: Record<EmotionTone, string> = {
  calm: "차분함",
  joyful: "기쁨",
  anxious: "불안함",
  tired: "피곤함",
  sad: "슬픔",
};

function getKstDateKey() {
  return createKoreanDateKey();
}

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function formatDateOnly(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function toIsoString(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function asObject<T>(value: Prisma.JsonValue | null | undefined): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}

function asMessageParts(
  value: Prisma.JsonValue | null | undefined,
): MessagePreviewRow["parts"] {
  return Array.isArray(value) ? (value as MessagePreviewRow["parts"]) : null;
}

function resolveSelectedPregnancyPosition(
  profile: ProfileRow,
  isoDate: string,
) {
  return resolvePregnancyPositionFromProfile(
    {
      pregnancyDayCount: profile.pregnancy_day_count,
      pregnancyWeek: profile.pregnancy_week,
      pregnancyDayInWeek: profile.pregnancy_day_in_week,
      dueDate: profile.due_date,
    },
    isoDate,
    getKstDateKey(),
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
  options: { deferUnsummarizedSessionSummary?: boolean } = {},
) {
  const aiSummary = records.find(
    (record) => record.entry_type === "ai_summary",
  );
  if (aiSummary?.summary) {
    return aiSummary.summary;
  }

  if (options.deferUnsummarizedSessionSummary) {
    if (relatedSessions.length === 0) {
      return null;
    }

    return `${relatedSessions.length}개의 대화가 있었어요. 하루 요약은 다음날 정리해 보여드릴게요.`;
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
  const profileRow = await prisma.pregnancy_profiles.findUnique({
    where: { user_id: userId },
    select: {
      pregnancy_day_count: true,
      pregnancy_week: true,
      pregnancy_day_in_week: true,
      due_date: true,
    },
  });
  const profile: ProfileRow | null = profileRow
    ? {
        pregnancy_day_count: profileRow.pregnancy_day_count,
        pregnancy_week: profileRow.pregnancy_week,
        pregnancy_day_in_week: profileRow.pregnancy_day_in_week,
        due_date: formatDateOnly(profileRow.due_date),
      }
    : null;
  if (!profile) {
    return [];
  }

  const position = resolveSelectedPregnancyPosition(profile, isoDate);
  if (!position) {
    return [];
  }

  const weekRecord = await prisma.content_pregnancy_week_data.findFirst({
    where: {
      week_number: position.weekNumber,
      status: "published",
    },
    select: { id: true },
  });
  const week: WeekRow | null = weekRecord;
  if (!week) {
    return [];
  }

  const [datedChecklistRows, genericChecklistRows] = await Promise.all([
    prisma.content_week_checklists.findMany({
      where: {
        week_data_id: week.id,
        day_number: position.dayNumber,
        is_active: true,
      },
      orderBy: { display_order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        display_order: true,
      },
    }),
    prisma.content_week_checklists.findMany({
      where: {
        week_data_id: week.id,
        day_number: null,
        is_active: true,
      },
      orderBy: { display_order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        display_order: true,
      },
    }),
  ]);

  const checklistRows = [...datedChecklistRows, ...genericChecklistRows];
  const checklistIds = checklistRows.map((row) => row.id);
  const checklistEvents = checklistIds.length
    ? await prisma.user_checklist_events.findMany({
        where: {
          user_id: userId,
          checklist_id: { in: checklistIds },
        },
        select: {
          checklist_id: true,
          status: true,
        },
      })
    : [];
  const completedByChecklistId = buildChecklistStatusMap(
    checklistEvents as ChecklistEventRow[],
  );

  return checklistRows.map((row) => ({
    id: row.id,
    label: buildChecklistLabel(row),
    completed: completedByChecklistId[row.id] ?? false,
  }));
}

async function loadDailyQuestions(
  userId: string,
  isoDate: string,
  records: CalendarRecordRow[],
) {
  const profileRow = await prisma.pregnancy_profiles.findUnique({
    where: { user_id: userId },
    select: {
      pregnancy_day_count: true,
      pregnancy_week: true,
      pregnancy_day_in_week: true,
      due_date: true,
    },
  });
  const profile: ProfileRow | null = profileRow
    ? {
        pregnancy_day_count: profileRow.pregnancy_day_count,
        pregnancy_week: profileRow.pregnancy_week,
        pregnancy_day_in_week: profileRow.pregnancy_day_in_week,
        due_date: formatDateOnly(profileRow.due_date),
      }
    : null;
  if (!profile) {
    return [];
  }

  const position = resolveSelectedPregnancyPosition(profile, isoDate);
  if (!position) {
    return [];
  }

  const weekRecord = await prisma.content_pregnancy_week_data.findFirst({
    where: {
      week_number: position.weekNumber,
      status: "published",
    },
    select: { id: true },
  });
  const week: WeekRow | null = weekRecord;
  if (!week) {
    return [];
  }

  const [datedQuestionRows, genericQuestionRows] = await Promise.all([
    prisma.content_week_questions.findMany({
      where: {
        week_data_id: week.id,
        day_number: position.dayNumber,
        is_active: true,
      },
      orderBy: { display_order: "asc" },
      select: {
        id: true,
        question_text: true,
        day_number: true,
      },
    }),
    prisma.content_week_questions.findMany({
      where: {
        week_data_id: week.id,
        day_number: null,
        is_active: true,
      },
      orderBy: { display_order: "asc" },
      select: {
        id: true,
        question_text: true,
        day_number: true,
      },
    }),
  ]);

  return buildDailyQuestionSummaries({
    datedQuestionRows: datedQuestionRows as QuestionRow[],
    genericQuestionRows: genericQuestionRows as QuestionRow[],
    records,
  });
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

    const records = (
      await prisma.calendar_logs.findMany({
        where: {
          user_id: userId,
          date: parseDateOnly(isoDate),
        },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          title: true,
          summary: true,
          entry_type: true,
          session_id: true,
          payload: true,
        },
      })
    ).map(
      (row): CalendarRecordRow => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        entry_type: row.entry_type,
        session_id: row.session_id,
        payload: asObject<CalendarRecordRow["payload"]>(row.payload),
      }),
    );

    const explicitSessionIds = records
      .map((record) => record.session_id)
      .filter((value): value is string => Boolean(value));
    const sessionActivityRows = (
      await prisma.v_chat_session_activity_dates.findMany({
        where: {
          user_id: userId,
          activity_date: parseDateOnly(isoDate),
        },
        orderBy: { last_message_at: "desc" },
        select: {
          session_id: true,
          last_message_at: true,
        },
      })
    )
      .filter(
        (
          row,
        ): row is typeof row & { session_id: string; last_message_at: Date } =>
          typeof row.session_id === "string" &&
          row.last_message_at instanceof Date,
      )
      .map(
        (row): SessionActivityRow => ({
          session_id: row.session_id,
          last_message_at: row.last_message_at.toISOString(),
        }),
      );
    const sessionIds = [
      ...new Set([
        ...explicitSessionIds,
        ...sessionActivityRows.map((row) => row.session_id),
      ]),
    ];
    const relatedSessions =
      sessionIds.length > 0
        ? (
            await prisma.chat_sessions.findMany({
              where: {
                id: { in: sessionIds },
                user_id: userId,
              },
              select: {
                id: true,
                title: true,
                last_message_at: true,
              },
            })
          ).map(
            (row): SessionRow => ({
              id: row.id,
              title: row.title,
              last_message_at: toIsoString(row.last_message_at),
              last_message_preview: null,
            }),
          )
        : [];
    const latestMessages =
      sessionIds.length > 0
        ? (
            await prisma.chat_messages.findMany({
              where: {
                session_id: { in: sessionIds },
              },
              orderBy: { created_at: "desc" },
              select: {
                session_id: true,
                plain_text: true,
                parts: true,
              },
            })
          ).map(
            (row): MessagePreviewRow => ({
              session_id: row.session_id,
              plain_text: row.plain_text,
              parts: asMessageParts(row.parts),
            }),
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
      {
        deferUnsummarizedSessionSummary: isoDate === getKstDateKey(),
      },
    );
    const dailyQuestions = await loadDailyQuestions(userId, isoDate, records);

    return NextResponse.json({
      recordDay: toRecordDayView({
        isoDate,
        infoViewed,
        emotionTone: resolvedEmotionTone,
        checklistItems,
        conversationSummary,
        dailyQuestions,
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

    const today = getKstDateKey();
    const now = new Date().toISOString();

    const profile = await prisma.pregnancy_profiles.findUnique({
      where: { user_id: userId },
      select: { onboarding_payload: true },
    });
    const existingOnboardingPayload =
      asObject<StoredOnboardingPayload>(profile?.onboarding_payload) ?? {};

    await prisma.calendar_logs.create({
      data: {
        user_id: userId,
        session_id: sessionId,
        date: parseDateOnly(today),
        entry_type: "emotion_checkin",
        title: EMOTION_TONE_LABELS[emotionTone as EmotionTone],
        payload: { emotionTone },
      },
    });

    await prisma.pregnancy_profiles.updateMany({
      where: { user_id: userId },
      data: {
        onboarding_payload: {
          ...existingOnboardingPayload,
          profileMemory: {
            ...(existingOnboardingPayload.profileMemory ?? {}),
            lastEmotionTone: emotionTone,
            updatedAt: now,
          },
        },
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mobile records POST route error", error);
    return mobileRouteErrorResponse(error, "failed to save emotion checkin");
  }
}
