import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  resolveQuestionAnswerDisplay,
  type RecordDayQuestionRecordRow,
} from "@gynecology-chatbot/mobile-api/record-day-questions";
import { dbSelect } from "@/lib/db/admin-client";
import { normalizePhoneNumberToE164 } from "@/lib/mobile/solapi-sms";
import {
  computePhoneNumberBlindIndex,
  decryptPhoneNumber,
} from "@/lib/privacy/phone-crypto";

import type { AdminChatsUserRow } from "@/components/admin/AdminChatsSection";
import type {
  AdminChatUserProfile,
  AdminChatSessionRow,
} from "@/components/admin/AdminChatUserDetail";
import type {
  AdminChatMessageRow,
  AdminChatQuestionAnswerRow,
} from "@/components/admin/AdminChatSessionMessages";
import type { AdminChatActionRow } from "@/components/admin/AdminChatActionsFeed";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toRequiredIso(value: Date | string): string {
  return toIso(value) ?? "";
}

function eq(value: string) {
  return encodeURIComponent(value);
}

function buildInFilter(values: string[]) {
  return values.join(",");
}

function safePhoneLast4(
  last4: string | null | undefined,
  encrypted: string | null | undefined,
): string | null {
  if (last4 && last4.trim()) return last4.trim();
  if (!encrypted) return null;
  try {
    const decrypted = decryptPhoneNumber(encrypted);
    const digits = decrypted.replace(/\D/g, "");
    return digits.slice(-4) || null;
  } catch {
    return null;
  }
}

function createPhoneNumberCandidates(phoneNumber: string): string[] {
  const trimmed = phoneNumber.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");
  const candidates = new Set<string>();

  if (trimmed) candidates.add(trimmed);
  if (digitsOnly) candidates.add(digitsOnly);

  try {
    const normalized = normalizePhoneNumberToE164(trimmed);
    candidates.add(normalized);

    if (normalized.startsWith("+82")) {
      candidates.add(`0${normalized.slice(3)}`);
    }
  } catch {
    // Phone search should degrade to the exact value the admin typed.
  }

  return Array.from(candidates);
}

function safePhoneNumberDisplay(
  encrypted: string | null | undefined,
  last4: string | null | undefined,
  legacyPhoneNumber: string | null | undefined,
): string {
  if (encrypted) {
    try {
      return decryptPhoneNumber(encrypted);
    } catch {
      // Fall back below if old rows cannot be decrypted with the current key.
    }
  }

  const rawPhoneNumber = legacyPhoneNumber?.trim();
  if (rawPhoneNumber) return rawPhoneNumber;

  const safeLast4 = safePhoneLast4(last4, encrypted);
  return safeLast4 ? `끝자리 ${safeLast4}` : "전화번호 없음";
}

async function findUserIdsByPhoneNumber(
  phoneNumber: string,
): Promise<string[]> {
  const trimmed = phoneNumber.trim();
  if (!trimmed) return [];

  const phoneClauses: Record<string, unknown>[] = [];
  const digitsOnly = trimmed.replace(/\D/g, "");

  for (const candidate of createPhoneNumberCandidates(trimmed)) {
    phoneClauses.push({ phone_number: candidate });

    try {
      phoneClauses.push({
        phone_number_blind_index: computePhoneNumberBlindIndex(candidate),
      });
    } catch {
      // Missing crypto env should not break legacy plaintext phone lookup.
    }
  }

  if (digitsOnly.length === 4) {
    phoneClauses.push({ phone_number_last4: digitsOnly });
  }

  if (phoneClauses.length === 0) return [];

  const users = await prisma.users.findMany({
    where: { OR: phoneClauses },
    select: { id: true },
    take: 200,
  });

  return users.map((user) => user.id);
}

export interface ChatUsersListResult {
  rows: AdminChatsUserRow[];
  totalMatched: number;
  pageSize: number;
}

export async function fetchChatUsersList(
  query: string,
  limit = 50,
): Promise<ChatUsersListResult> {
  const trimmed = query.trim();
  const userIdFilter = new Set<string>();

  if (trimmed) {
    if (UUID_REGEX.test(trimmed)) {
      userIdFilter.add(trimmed);
    }

    // Try phone blind index match (if looks like phone)
    if (/^[+\d\s\-]+$/.test(trimmed)) {
      try {
        const blindIndex = computePhoneNumberBlindIndex(trimmed);
        const matched = await prisma.users.findMany({
          where: { phone_number_blind_index: blindIndex },
          select: { id: true },
          take: 5,
        });
        for (const user of matched) userIdFilter.add(user.id);
      } catch {
        // ignore phone hash failures
      }
    }

    // Display name match (pregnancy_profiles)
    const profileMatches = await prisma.pregnancy_profiles.findMany({
      where: {
        display_name: { contains: trimmed, mode: "insensitive" },
      },
      select: { user_id: true },
      take: 200,
    });
    for (const profile of profileMatches) userIdFilter.add(profile.user_id);
  }

  const where = trimmed ? { id: { in: Array.from(userIdFilter) } } : undefined;

  const [totalMatched, userRecords] = await Promise.all([
    trimmed
      ? userIdFilter.size
      : prisma.users.count({ where: { role: "user" } }),
    prisma.users.findMany({
      where: trimmed ? where : { role: "user" },
      select: {
        id: true,
        account_status: true,
        phone_number_encrypted: true,
        phone_number_last4: true,
        pregnancy_profiles: {
          select: {
            display_name: true,
            pregnancy_week: true,
            pregnancy_day_in_week: true,
            week_override: true,
            day_override: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    }),
  ]);

  if (userRecords.length === 0) {
    return { rows: [], totalMatched, pageSize: limit };
  }

  const userIds = userRecords.map((user) => user.id);

  const [sessionAggregates, messageAggregates] = await Promise.all([
    prisma.chat_sessions.groupBy({
      by: ["user_id"],
      where: { user_id: { in: userIds } },
      _max: { last_message_at: true },
    }),
    prisma.chat_messages.groupBy({
      by: ["user_id"],
      where: { user_id: { in: userIds } },
      _count: { _all: true },
    }),
  ]);

  const sessionMap = new Map(
    sessionAggregates.map((row) => [
      row.user_id,
      row._max.last_message_at ?? null,
    ]),
  );
  const messageCountMap = new Map(
    messageAggregates.map((row) => [row.user_id, row._count._all]),
  );

  const rows: AdminChatsUserRow[] = userRecords.map((user) => {
    const profile = user.pregnancy_profiles ?? null;
    const week = profile?.week_override ?? profile?.pregnancy_week ?? null;
    const day = profile?.day_override ?? profile?.pregnancy_day_in_week ?? null;
    return {
      userId: user.id,
      displayName: profile?.display_name ?? null,
      phoneLast4: safePhoneLast4(
        user.phone_number_last4,
        user.phone_number_encrypted,
      ),
      week,
      day,
      lastMessageAt: toIso(sessionMap.get(user.id) ?? null),
      messageCount: messageCountMap.get(user.id) ?? 0,
      accountStatus: user.account_status,
    };
  });

  rows.sort((a, b) => {
    const aTime = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
    const bTime = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
    return bTime - aTime;
  });

  return { rows, totalMatched, pageSize: limit };
}

export interface ChatUserDetailResult {
  profile: AdminChatUserProfile;
  sessions: AdminChatSessionRow[];
}

type DbUserRow = {
  id: string;
  account_status: string;
  phone_number_encrypted: string | null;
  phone_number_last4: string | null;
  created_at: string | Date;
  last_login_at: string | Date | null;
};

type DbProfileRow = {
  display_name: string | null;
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
  week_override: number | null;
  day_override: number | null;
};

type DbSessionRow = {
  id: string;
  title: string;
  status: string;
  last_message_at: string | Date | null;
  created_at: string | Date;
};

async function fetchChatUserDetailFromDbClient(
  userId: string,
  sessionLimit: number,
): Promise<ChatUserDetailResult | null> {
  const [userRows, profileRows] = await Promise.all([
    dbSelect<DbUserRow[]>(
      `users?select=id,account_status,phone_number_encrypted,phone_number_last4,created_at,last_login_at&id=eq.${eq(userId)}&limit=1`,
    ),
    dbSelect<DbProfileRow[]>(
      `pregnancy_profiles?select=display_name,pregnancy_week,pregnancy_day_in_week,week_override,day_override&user_id=eq.${eq(userId)}&limit=1`,
    ),
  ]);

  const user = userRows[0] ?? null;
  if (!user) return null;

  const profile = profileRows[0] ?? null;
  const week = profile?.week_override ?? profile?.pregnancy_week ?? null;
  const day = profile?.day_override ?? profile?.pregnancy_day_in_week ?? null;
  const sessionRecords = await dbSelect<DbSessionRow[]>(
    `chat_sessions?select=id,title,status,last_message_at,created_at&user_id=eq.${eq(userId)}&order=last_message_at.desc.nullslast,created_at.desc&limit=${sessionLimit}`,
  );
  const sessionIds = sessionRecords.map((session) => session.id);
  const messageRows = sessionIds.length
    ? await dbSelect<Array<{ session_id: string }>>(
        `chat_messages?select=session_id&session_id=in.(${buildInFilter(sessionIds)})`,
      )
    : [];
  const messageCountBySessionId = new Map<string, number>();
  for (const row of messageRows) {
    messageCountBySessionId.set(
      row.session_id,
      (messageCountBySessionId.get(row.session_id) ?? 0) + 1,
    );
  }

  return {
    profile: {
      userId: user.id,
      displayName: profile?.display_name ?? null,
      phoneLast4: safePhoneLast4(
        user.phone_number_last4,
        user.phone_number_encrypted,
      ),
      week,
      day,
      accountStatus: user.account_status,
      createdAt: toIso(user.created_at),
      lastLoginAt: toIso(user.last_login_at),
    },
    sessions: sessionRecords.map((session) => ({
      sessionId: session.id,
      title: session.title,
      status: session.status,
      lastMessageAt: toIso(session.last_message_at),
      createdAt: toIso(session.created_at),
      messageCount: messageCountBySessionId.get(session.id) ?? 0,
    })),
  };
}

export async function fetchChatUserDetail(
  userId: string,
  sessionLimit = 50,
): Promise<ChatUserDetailResult | null> {
  if (!isUuid(userId)) {
    return fetchChatUserDetailFromDbClient(userId, sessionLimit);
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      account_status: true,
      phone_number_encrypted: true,
      phone_number_last4: true,
      created_at: true,
      last_login_at: true,
      pregnancy_profiles: {
        select: {
          display_name: true,
          pregnancy_week: true,
          pregnancy_day_in_week: true,
          week_override: true,
          day_override: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const profile = user.pregnancy_profiles ?? null;
  const week = profile?.week_override ?? profile?.pregnancy_week ?? null;
  const day = profile?.day_override ?? profile?.pregnancy_day_in_week ?? null;

  const sessionRecords = await prisma.chat_sessions.findMany({
    where: { user_id: userId },
    orderBy: [
      { last_message_at: { sort: "desc", nulls: "last" } },
      { created_at: "desc" },
    ],
    take: sessionLimit,
    select: {
      id: true,
      title: true,
      status: true,
      last_message_at: true,
      created_at: true,
      _count: { select: { chat_messages: true } },
    },
  });

  const sessions: AdminChatSessionRow[] = sessionRecords.map((session) => ({
    sessionId: session.id,
    title: session.title,
    status: session.status,
    lastMessageAt: toIso(session.last_message_at),
    createdAt: toIso(session.created_at),
    messageCount: session._count.chat_messages,
  }));

  return {
    profile: {
      userId: user.id,
      displayName: profile?.display_name ?? null,
      phoneLast4: safePhoneLast4(
        user.phone_number_last4,
        user.phone_number_encrypted,
      ),
      week,
      day,
      accountStatus: user.account_status,
      createdAt: toIso(user.created_at),
      lastLoginAt: toIso(user.last_login_at),
    },
    sessions,
  };
}

export interface ChatSessionMessagesResult {
  sessionTitle: string;
  messages: AdminChatMessageRow[];
  questionAnswers: AdminChatQuestionAnswerRow[];
}

function summarizeParts(parts: unknown): string {
  if (!Array.isArray(parts) || parts.length === 0) return "";
  return parts
    .map((part) => {
      if (part && typeof part === "object") {
        const type = (part as { type?: unknown }).type;
        if (typeof type === "string") return type;
      }
      return typeof part === "string" ? "text" : "unknown";
    })
    .join(", ");
}

type DbMessageRow = {
  id: string;
  role: string;
  plain_text: string;
  parts: unknown;
  model_name: string | null;
  created_at: string | Date;
};

type DbQuestionEventRow = {
  id: string;
  question_id: string;
  status: string;
  sent_at: string | Date | null;
  answered_at: string | Date | null;
  answer_text: string | null;
};

type DbQuestionRow = {
  id: string;
  question_text: string;
};

type DbQuestionSummaryRow = {
  title: string | null;
  summary: string | null;
  entry_type: string | null;
  session_id: string | null;
  payload: unknown;
};

async function fetchChatSessionMessagesFromDbClient(
  userId: string,
  sessionId: string,
  limit: number,
): Promise<ChatSessionMessagesResult | null> {
  const session = (
    await dbSelect<Array<{ id: string; title: string }>>(
      `chat_sessions?select=id,title&id=eq.${eq(sessionId)}&user_id=eq.${eq(userId)}&limit=1`,
    )
  )[0];

  if (!session) return null;

  const [messageRecords, questionEventRecords] = await Promise.all([
    dbSelect<DbMessageRow[]>(
      `chat_messages?select=id,role,plain_text,parts,model_name,created_at&session_id=eq.${eq(sessionId)}&order=created_at.asc&limit=${limit}`,
    ),
    dbSelect<DbQuestionEventRow[]>(
      `user_question_events?select=id,question_id,status,sent_at,answered_at,answer_text&user_id=eq.${eq(userId)}&session_id=eq.${eq(sessionId)}&order=sent_at.asc,created_at.asc`,
    ),
  ]);

  const questionIds = Array.from(
    new Set(questionEventRecords.map((event) => event.question_id)),
  );
  const [questionRows, summaryRecords] = await Promise.all([
    questionIds.length
      ? dbSelect<DbQuestionRow[]>(
          `content_week_questions?select=id,question_text&id=in.(${buildInFilter(questionIds)})`,
        )
      : Promise.resolve([]),
    questionIds.length
      ? dbSelect<DbQuestionSummaryRow[]>(
          `calendar_logs?select=title,summary,entry_type,session_id,payload&user_id=eq.${eq(userId)}&session_id=eq.${eq(sessionId)}&entry_type=eq.question_summary&order=created_at.desc`,
        )
      : Promise.resolve([]),
  ]);
  const questionTextById = new Map(
    questionRows.map((question) => [question.id, question.question_text]),
  );

  const messages: AdminChatMessageRow[] = messageRecords.map((message) => ({
    messageId: message.id,
    role: message.role,
    plainText: message.plain_text,
    partsSummary: summarizeParts(message.parts),
    modelName: message.model_name ?? null,
    createdAt: toRequiredIso(message.created_at),
  }));

  const appDisplayRecords: RecordDayQuestionRecordRow[] = [
    ...questionEventRecords.map((event): RecordDayQuestionRecordRow => {
      const questionText =
        questionTextById.get(event.question_id) ?? "오늘의 질문";
      return {
        title: questionText,
        summary: event.answer_text,
        entry_type: "survey_response",
        session_id: sessionId,
        payload: {
          source: "user_question_events",
          questionId: event.question_id,
          question: questionText,
          answer: event.answer_text ?? undefined,
        },
      };
    }),
    ...summaryRecords.map((record): RecordDayQuestionRecordRow => {
      const payload =
        record.payload &&
        typeof record.payload === "object" &&
        !Array.isArray(record.payload)
          ? (record.payload as RecordDayQuestionRecordRow["payload"])
          : null;

      return {
        title: record.title ?? "오늘의 질문",
        summary: record.summary,
        entry_type: record.entry_type ?? "question_summary",
        session_id: record.session_id,
        payload,
      };
    }),
  ];

  const questionAnswers: AdminChatQuestionAnswerRow[] =
    questionEventRecords.map((event) => {
      const questionText =
        questionTextById.get(event.question_id) ?? "오늘의 질문";
      return {
        eventId: event.id,
        questionId: event.question_id,
        questionText,
        answerText: event.answer_text ?? null,
        appSummary: resolveQuestionAnswerDisplay(appDisplayRecords, {
          id: event.question_id,
          question_text: questionText,
          day_number: null,
        }),
        status: event.status,
        sentAt: toIso(event.sent_at),
        answeredAt: toIso(event.answered_at),
      };
    });

  return { sessionTitle: session.title, messages, questionAnswers };
}

export async function fetchChatSessionMessages(
  userId: string,
  sessionId: string,
  limit = 500,
): Promise<ChatSessionMessagesResult | null> {
  if (!isUuid(userId) || !isUuid(sessionId)) {
    return fetchChatSessionMessagesFromDbClient(userId, sessionId, limit);
  }

  const session = await prisma.chat_sessions.findFirst({
    where: { id: sessionId, user_id: userId },
    select: { id: true, title: true },
  });

  if (!session) {
    return null;
  }

  const messageRecords = await prisma.chat_messages.findMany({
    where: { session_id: sessionId },
    orderBy: { created_at: "asc" },
    take: limit,
    select: {
      id: true,
      role: true,
      plain_text: true,
      parts: true,
      model_name: true,
      created_at: true,
    },
  });

  const messages: AdminChatMessageRow[] = messageRecords.map((message) => ({
    messageId: message.id,
    role: message.role,
    plainText: message.plain_text,
    partsSummary: summarizeParts(message.parts),
    modelName: message.model_name ?? null,
    createdAt: message.created_at.toISOString(),
  }));

  const questionEventRecords = await prisma.user_question_events.findMany({
    where: { user_id: userId, session_id: sessionId },
    orderBy: [{ sent_at: "asc" }, { created_at: "asc" }],
    select: {
      id: true,
      question_id: true,
      status: true,
      sent_at: true,
      answered_at: true,
      answer_text: true,
      content_week_questions: {
        select: { question_text: true },
      },
    },
  });

  const questionIds = questionEventRecords.map((event) => event.question_id);
  const summaryRecords =
    questionIds.length > 0
      ? await prisma.calendar_logs.findMany({
          where: {
            user_id: userId,
            session_id: sessionId,
            entry_type: "question_summary",
          },
          orderBy: { created_at: "desc" },
          select: {
            title: true,
            summary: true,
            entry_type: true,
            session_id: true,
            payload: true,
          },
        })
      : [];
  const appDisplayRecords: RecordDayQuestionRecordRow[] = [
    ...questionEventRecords.map(
      (event): RecordDayQuestionRecordRow => ({
        title: event.content_week_questions?.question_text ?? "오늘의 질문",
        summary: event.answer_text,
        entry_type: "survey_response",
        session_id: sessionId,
        payload: {
          source: "user_question_events",
          questionId: event.question_id,
          question: event.content_week_questions?.question_text,
          answer: event.answer_text ?? undefined,
        },
      }),
    ),
    ...summaryRecords.map((record): RecordDayQuestionRecordRow => {
      const payload =
        record.payload &&
        typeof record.payload === "object" &&
        !Array.isArray(record.payload)
          ? (record.payload as RecordDayQuestionRecordRow["payload"])
          : null;

      return {
        title: record.title ?? "오늘의 질문",
        summary: record.summary,
        entry_type: record.entry_type ?? "question_summary",
        session_id: record.session_id,
        payload,
      };
    }),
  ];

  const questionAnswers: AdminChatQuestionAnswerRow[] =
    questionEventRecords.map((event) => ({
      eventId: event.id,
      questionId: event.question_id,
      questionText:
        event.content_week_questions?.question_text ?? "오늘의 질문",
      answerText: event.answer_text ?? null,
      appSummary: resolveQuestionAnswerDisplay(appDisplayRecords, {
        id: event.question_id,
        question_text:
          event.content_week_questions?.question_text ?? "오늘의 질문",
        day_number: null,
      }),
      status: event.status,
      sentAt: toIso(event.sent_at),
      answeredAt: toIso(event.answered_at),
    }));

  return { sessionTitle: session.title, messages, questionAnswers };
}

export interface ChatActionsResult {
  actions: AdminChatActionRow[];
  actionTypes: string[];
}

function formatActionDetail(actionType: string, payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  try {
    const serialized = JSON.stringify(payload);
    if (serialized === "{}") return "";
    return serialized.length > 240
      ? `${serialized.slice(0, 240)}...`
      : serialized;
  } catch {
    return String(actionType);
  }
}

export async function fetchChatActions(
  filters: {
    phoneNumber: string;
    userId?: string;
    actionType: string;
    from: string;
    to: string;
  },
  limit = 200,
): Promise<ChatActionsResult> {
  const where: Record<string, unknown> = {};
  const phoneNumberFilter = filters.phoneNumber.trim();
  const legacyUserIdFilter = filters.userId?.trim() ?? "";
  if (phoneNumberFilter) {
    const userIds = UUID_REGEX.test(phoneNumberFilter)
      ? [phoneNumberFilter]
      : await findUserIdsByPhoneNumber(phoneNumberFilter);
    where.user_id = { in: userIds };
  } else if (legacyUserIdFilter && UUID_REGEX.test(legacyUserIdFilter)) {
    where.user_id = legacyUserIdFilter;
  }
  if (filters.actionType && filters.actionType !== "all") {
    where.action_type = filters.actionType;
  }

  const occurredAt: Record<string, Date> = {};
  if (filters.from) {
    const fromDate = new Date(`${filters.from}T00:00:00Z`);
    if (!Number.isNaN(fromDate.getTime())) occurredAt.gte = fromDate;
  }
  if (filters.to) {
    const toDate = new Date(`${filters.to}T23:59:59Z`);
    if (!Number.isNaN(toDate.getTime())) occurredAt.lte = toDate;
  }
  if (Object.keys(occurredAt).length > 0) {
    where.occurred_at = occurredAt;
  }

  const [records, typeRows] = await Promise.all([
    prisma.user_action_logs.findMany({
      where,
      orderBy: { occurred_at: "desc" },
      take: limit,
      select: {
        id: true,
        user_id: true,
        action_type: true,
        payload: true,
        occurred_at: true,
      },
    }),
    prisma.user_action_logs.findMany({
      distinct: ["action_type"],
      select: { action_type: true },
      orderBy: { action_type: "asc" },
      take: 50,
    }),
  ]);

  const uniqueUserIds = Array.from(
    new Set(records.map((record) => record.user_id)),
  );

  const users = uniqueUserIds.length
    ? await prisma.users.findMany({
        where: { id: { in: uniqueUserIds } },
        select: {
          id: true,
          phone_number: true,
          phone_number_encrypted: true,
          phone_number_last4: true,
          pregnancy_profiles: {
            select: { display_name: true },
          },
        },
      })
    : [];

  const userDisplayMap = new Map(
    users.map((user) => [
      user.id,
      {
        label: user.pregnancy_profiles?.display_name?.trim() || "사용자",
        phoneNumber: safePhoneNumberDisplay(
          user.phone_number_encrypted,
          user.phone_number_last4,
          user.phone_number,
        ),
      },
    ]),
  );

  const actions: AdminChatActionRow[] = records.map((record) => {
    const userDisplay = userDisplayMap.get(record.user_id);
    return {
      id: record.id,
      userId: record.user_id,
      userLabel: userDisplay?.label ?? "사용자",
      phoneNumber: userDisplay?.phoneNumber ?? "전화번호 없음",
      actionType: record.action_type,
      detail: formatActionDetail(record.action_type, record.payload),
      occurredAt: record.occurred_at.toISOString(),
    };
  });

  return {
    actions,
    actionTypes: typeRows
      .map((row) => row.action_type)
      .filter((value): value is string => typeof value === "string"),
  };
}
