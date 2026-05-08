import type { TodayChecklistItem } from "@gynecology-chatbot/app-core";
import {
  addCalendarDays,
  createKoreanDateKey,
  createKoreanDateTime,
  resolvePregnancyPositionFromProfile,
} from "@gynecology-chatbot/app-core/time";

import { buildDailyQuestionSummaries } from "../record-day-questions";
import { sanitizeInlineCitationMarkers } from "../chat/sanitizers";
import { dbInsert, dbSelect, dbUpdate } from "../db/admin-client";
import { resolveRecentChatPreview, toRecordDayView } from "../serializers";

export type CalendarRecordRow = {
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

export type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  summary?: string | null;
};

export type SessionActivityRow = {
  session_id: string;
  last_message_at: string;
};

export type MessagePreviewRow = {
  session_id: string;
  plain_text: string | null;
  parts: Array<{
    type?: string;
    text?: string;
    choices?: unknown[] | null;
  }> | null;
};

export type ProfileRow = {
  pregnancy_day_count: number | null;
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
  due_date: string | null;
};

export type WeekRow = { id: string };

export type ChecklistRow = {
  id: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
};

export type ChecklistEventRow = {
  checklist_id: string;
  status: "sent" | "opened" | "completed" | "skipped";
};

export type QuestionRow = {
  id: string;
  question_text: string;
  day_number: number | null;
};

export type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

export type StoredProfileMemory = {
  lastEmotionTone?: EmotionTone | null;
  updatedAt?: string | null;
};

export type StoredOnboardingPayload = {
  profileMemory?: StoredProfileMemory | null;
  [key: string]: unknown;
};

export const VALID_EMOTION_TONES: EmotionTone[] = [
  "calm",
  "joyful",
  "anxious",
  "tired",
  "sad",
];

export const EMOTION_TONE_LABELS: Record<EmotionTone, string> = {
  calm: "차분함",
  joyful: "기쁨",
  anxious: "불안함",
  tired: "피곤함",
  sad: "슬픔",
};

export function isValidEmotionTone(value: string): value is EmotionTone {
  return VALID_EMOTION_TONES.includes(value as EmotionTone);
}

export const DAY_CONVERSATION_SUMMARY_SOURCE = "daily_conversation_summary";
const DAY_CONVERSATION_SUMMARY_MAX_CHARS = 320;
const SESSION_CONVERSATION_SUMMARY_MAX_CHARS = 300;

export function getKstDateKey() {
  return createKoreanDateKey();
}

export function createKstDayRange(isoDate: string) {
  return {
    start: createKoreanDateTime({ isoDate }),
    end: createKoreanDateTime({ isoDate: addCalendarDays(isoDate, 1) }),
  };
}

export function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

export function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

export function asObject<T>(value: unknown): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}

export function asMessageParts(value: unknown): MessagePreviewRow["parts"] {
  return Array.isArray(value) ? (value as MessagePreviewRow["parts"]) : null;
}

export function resolveSelectedPregnancyPosition(
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

export function buildChecklistStatusMap(events: ChecklistEventRow[]) {
  return events.reduce<Record<string, boolean>>((map, event) => {
    if (event.status === "completed") {
      map[event.checklist_id] = true;
    }
    return map;
  }, {});
}

export function buildChecklistLabel(row: ChecklistRow) {
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

export function limitSummaryText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength).trimEnd();
}

export function buildConversationSummary(
  records: CalendarRecordRow[],
  relatedSessions: SessionRow[],
  options: { deferUnsummarizedSessionSummary?: boolean } = {},
) {
  const dailySummary = records.find(
    (record) =>
      record.entry_type === "ai_summary" &&
      !record.session_id &&
      record.payload?.source === DAY_CONVERSATION_SUMMARY_SOURCE,
  );
  if (dailySummary?.summary) {
    return limitSummaryText(
      dailySummary.summary,
      DAY_CONVERSATION_SUMMARY_MAX_CHARS,
    );
  }

  const legacyDailySummary = records.find(
    (record) =>
      record.entry_type === "ai_summary" &&
      !record.session_id &&
      record.summary,
  );
  if (legacyDailySummary?.summary) {
    return limitSummaryText(
      legacyDailySummary.summary,
      DAY_CONVERSATION_SUMMARY_MAX_CHARS,
    );
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
    return limitSummaryText(
      String(chatSummary.payload.compactSummary).replace(/^현재 단계:\s*/u, ""),
      DAY_CONVERSATION_SUMMARY_MAX_CHARS,
    );
  }
  if (chatSummary?.summary) {
    return limitSummaryText(
      chatSummary.summary,
      DAY_CONVERSATION_SUMMARY_MAX_CHARS,
    );
  }
  if (chatSummary?.payload?.assistantSummary) {
    return limitSummaryText(
      String(chatSummary.payload.assistantSummary),
      DAY_CONVERSATION_SUMMARY_MAX_CHARS,
    );
  }

  if (relatedSessions.length === 0) {
    return null;
  }

  return `${relatedSessions.length}개의 대화가 있었어요. 하루 요약은 다음날 정리해 보여드릴게요.`;
}

export function buildSessionSummaryById(records: CalendarRecordRow[]) {
  const summaryBySessionId = new Map<string, string>();

  for (const record of records) {
    if (
      record.entry_type !== "ai_summary" ||
      !record.session_id ||
      !record.summary ||
      record.payload?.source === DAY_CONVERSATION_SUMMARY_SOURCE ||
      summaryBySessionId.has(record.session_id)
    ) {
      continue;
    }

    summaryBySessionId.set(
      record.session_id,
      limitSummaryText(record.summary, SESSION_CONVERSATION_SUMMARY_MAX_CHARS),
    );
  }

  return summaryBySessionId;
}

function buildInFilter(values: string[]) {
  return values.join(",");
}

async function loadProfile(userId: string) {
  const rows = await dbSelect<ProfileRow[]>(
    `pregnancy_profiles?select=pregnancy_day_count,pregnancy_week,pregnancy_day_in_week,due_date&user_id=eq.${userId}&limit=1`,
  );
  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    pregnancy_day_count: row.pregnancy_day_count,
    pregnancy_week: row.pregnancy_week,
    pregnancy_day_in_week: row.pregnancy_day_in_week,
    due_date: formatDateOnly(row.due_date),
  } satisfies ProfileRow;
}

async function loadPublishedWeek(weekNumber: number) {
  const rows = await dbSelect<WeekRow[]>(
    `content_pregnancy_week_data?select=id&week_number=eq.${weekNumber}&status=eq.published&limit=1`,
  );
  return rows[0] ?? null;
}

export async function loadChecklistItems(
  userId: string,
  isoDate: string,
): Promise<TodayChecklistItem[]> {
  const profile = await loadProfile(userId);
  if (!profile) {
    return [];
  }

  const position = resolveSelectedPregnancyPosition(profile, isoDate);
  if (!position) {
    return [];
  }

  const week = await loadPublishedWeek(position.weekNumber);
  if (!week) {
    return [];
  }

  const [datedChecklistRows, genericChecklistRows] = await Promise.all([
    dbSelect<ChecklistRow[]>(
      `content_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=eq.${position.dayNumber}&is_active=eq.true&order=display_order.asc`,
    ),
    dbSelect<ChecklistRow[]>(
      `content_week_checklists?select=id,title,description,display_order&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc`,
    ),
  ]);

  const checklistRows = [...datedChecklistRows, ...genericChecklistRows];
  const checklistIds = checklistRows.map((row) => row.id);
  const checklistEvents = checklistIds.length
    ? await dbSelect<ChecklistEventRow[]>(
        `user_checklist_events?select=checklist_id,status&user_id=eq.${userId}&checklist_id=in.(${buildInFilter(checklistIds)})`,
      )
    : [];
  const completedByChecklistId = buildChecklistStatusMap(checklistEvents);

  return checklistRows.map((row) => ({
    id: row.id,
    label: buildChecklistLabel(row),
    completed: completedByChecklistId[row.id] ?? false,
  }));
}

export async function loadDailyQuestions(
  userId: string,
  isoDate: string,
  records: CalendarRecordRow[],
  options: { deferUnfinalizedToToday?: boolean } = {},
) {
  const profile = await loadProfile(userId);
  if (!profile) {
    return [];
  }

  const position = resolveSelectedPregnancyPosition(profile, isoDate);
  if (!position) {
    return [];
  }

  const week = await loadPublishedWeek(position.weekNumber);
  if (!week) {
    return [];
  }

  const [datedQuestionRows, genericQuestionRows] = await Promise.all([
    dbSelect<QuestionRow[]>(
      `content_week_questions?select=id,question_text,day_number&week_data_id=eq.${week.id}&day_number=eq.${position.dayNumber}&is_active=eq.true&order=display_order.asc`,
    ),
    dbSelect<QuestionRow[]>(
      `content_week_questions?select=id,question_text,day_number&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc`,
    ),
  ]);
  const questionRows = [...datedQuestionRows, ...genericQuestionRows];
  const questionIds = questionRows.map((question) => question.id);
  const questionById = new Map(
    questionRows.map((question) => [question.id, question]),
  );
  const dayRange = createKstDayRange(isoDate);
  const answeredQuestionRecords = questionIds.length
    ? (
        await dbSelect<
          Array<{
            question_id: string;
            answer_text: string | null;
            answered_at: string | null;
          }>
        >(
          `user_question_events?select=question_id,answer_text,answered_at&user_id=eq.${userId}&question_id=in.(${buildInFilter(questionIds)})&status=eq.answered&answered_at=gte.${dayRange.start.toISOString()}&answered_at=lt.${dayRange.end.toISOString()}&order=answered_at.desc`,
        )
      )
        .filter((row) => row.answer_text?.trim())
        .map((row): CalendarRecordRow => {
          const question = questionById.get(row.question_id);
          return {
            id: `question-event-${row.question_id}`,
            title: question?.question_text ?? "오늘의 질문",
            summary: row.answer_text,
            entry_type: "survey_response",
            session_id: null,
            payload: {
              source: "user_question_events",
              questionId: row.question_id,
              question: question?.question_text,
              answer: row.answer_text ?? undefined,
            },
          };
        })
    : [];

  return buildDailyQuestionSummaries({
    datedQuestionRows,
    genericQuestionRows,
    records: [...answeredQuestionRecords, ...records],
    deferUnfinalizedToToday: options.deferUnfinalizedToToday,
  });
}

export async function loadRecordDayView(userId: string, isoDate: string) {
  const checklistItems = await loadChecklistItems(userId, isoDate);

  const records = (
    await dbSelect<CalendarRecordRow[]>(
      `calendar_logs?select=id,title,summary,entry_type,session_id,payload&user_id=eq.${userId}&date=eq.${isoDate}&order=created_at.desc`,
    )
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
    await dbSelect<
      Array<{
        session_id: string | null;
        last_message_at: string | null;
      }>
    >(
      `v_chat_session_activity_dates?select=session_id,last_message_at&user_id=eq.${userId}&activity_date=eq.${isoDate}&order=last_message_at.desc`,
    )
  )
    .filter(
      (
        row,
      ): row is typeof row & { session_id: string; last_message_at: string } =>
        typeof row.session_id === "string" &&
        typeof row.last_message_at === "string",
    )
    .map(
      (row): SessionActivityRow => ({
        session_id: row.session_id,
        last_message_at: row.last_message_at,
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
          await dbSelect<
            Array<{
              id: string;
              title: string | null;
              last_message_at: string | null;
            }>
          >(
            `chat_sessions?select=id,title,last_message_at&id=in.(${buildInFilter(sessionIds)})&user_id=eq.${userId}`,
          )
        ).map(
          (row): SessionRow => ({
            id: row.id,
            title: row.title ?? "대화",
            last_message_at: toIsoString(row.last_message_at),
            last_message_preview: null,
          }),
        )
      : [];
  const latestMessages =
    sessionIds.length > 0
      ? (
          await dbSelect<
            Array<{
              session_id: string;
              plain_text: string | null;
              parts: unknown;
            }>
          >(
            `chat_messages?select=session_id,plain_text,parts&session_id=in.(${buildInFilter(sessionIds)})&order=created_at.desc`,
          )
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
      summary: null,
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
    rawTone && isValidEmotionTone(rawTone) ? rawTone : null;
  const conversationSummary = buildConversationSummary(
    records,
    orderedRelatedSessions,
    {
      deferUnsummarizedSessionSummary: isoDate === getKstDateKey(),
    },
  );
  const dailyQuestions = await loadDailyQuestions(userId, isoDate, records, {
    deferUnfinalizedToToday: isoDate === getKstDateKey(),
  });

  return toRecordDayView({
    isoDate,
    infoViewed,
    emotionTone: resolvedEmotionTone,
    checklistItems,
    conversationSummary,
    dailyQuestions,
    records,
    relatedSessions: orderedRelatedSessions,
  });
}

export async function recordEmotionCheckin(input: {
  userId: string;
  sessionId: string;
  emotionTone: EmotionTone;
}) {
  const today = getKstDateKey();
  const now = new Date().toISOString();

  const profile = (
    await dbSelect<Array<{ onboarding_payload: unknown }>>(
      `pregnancy_profiles?select=onboarding_payload&user_id=eq.${input.userId}&limit=1`,
    )
  )[0];
  const existingOnboardingPayload =
    asObject<StoredOnboardingPayload>(profile?.onboarding_payload) ?? {};

  await dbInsert("calendar_logs", {
    user_id: input.userId,
    session_id: input.sessionId,
    date: today,
    entry_type: "emotion_checkin",
    title: EMOTION_TONE_LABELS[input.emotionTone],
    payload: { emotionTone: input.emotionTone },
  });

  await dbUpdate(`pregnancy_profiles?user_id=eq.${input.userId}`, {
    onboarding_payload: {
      ...existingOnboardingPayload,
      profileMemory: {
        ...(existingOnboardingPayload.profileMemory ?? {}),
        lastEmotionTone: input.emotionTone,
        updatedAt: now,
      },
    },
    updated_at: now,
  });
}
