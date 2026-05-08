import {
  resolveRecentChatPreview,
  toChatSession,
  toRecentChats,
} from "../serializers";
import { dbSelect } from "../db/admin-client";

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  summary?: string | null;
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

type SessionSummaryRow = {
  session_id: string | null;
  summary: string | null;
};

type SessionMessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: unknown;
  created_at: string;
};

function buildInFilter(values: string[]) {
  return values.join(",");
}

function normalizeSummary(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function asMessageParts(value: unknown): MessagePreviewRow["parts"] {
  return Array.isArray(value) ? (value as MessagePreviewRow["parts"]) : null;
}

function asParts(value: unknown) {
  return Array.isArray(value) ? (value as never[]) : [];
}

export async function loadMobileChatSessions(userId: string) {
  const sessions = (
    await dbSelect<
      Array<{
        id: string;
        title: string | null;
        last_message_at: string | null;
      }>
    >(
      `chat_sessions?select=id,title,last_message_at&user_id=eq.${userId}&order=last_message_at.desc`,
    )
  ).map(
    (session): SessionRow => ({
      id: session.id,
      title: session.title ?? "대화",
      last_message_at: session.last_message_at,
      last_message_preview: null,
    }),
  );

  const sessionIds = sessions.map((session) => session.id);
  if (sessionIds.length === 0) {
    return toRecentChats(sessions);
  }

  const sessionIdFilter = buildInFilter(sessionIds);
  const [latestMessages, summaryRows] = await Promise.all([
    dbSelect<
      Array<{
        session_id: string;
        plain_text: string | null;
        parts: unknown;
      }>
    >(
      `chat_messages?select=session_id,plain_text,parts&session_id=in.(${sessionIdFilter})&order=created_at.desc`,
    ),
    dbSelect<SessionSummaryRow[]>(
      `calendar_logs?select=session_id,summary&user_id=eq.${userId}&session_id=in.(${sessionIdFilter})&entry_type=eq.ai_summary&order=created_at.desc`,
    ),
  ]);

  const summaryBySessionId = new Map<string, string>();
  for (const row of summaryRows) {
    if (!row.session_id || summaryBySessionId.has(row.session_id)) {
      continue;
    }

    const summary = normalizeSummary(row.summary);
    if (summary) {
      summaryBySessionId.set(row.session_id, summary);
    }
  }

  const previewBySessionId = new Map<string, string>();
  for (const row of latestMessages) {
    if (previewBySessionId.has(row.session_id)) {
      continue;
    }

    const preview = resolveRecentChatPreview({
      plainText: row.plain_text,
      parts: asMessageParts(row.parts),
    });
    if (preview) {
      previewBySessionId.set(row.session_id, preview);
    }
  }

  return toRecentChats(
    sessions.map((session) => ({
      ...session,
      last_message_preview:
        summaryBySessionId.get(session.id) ??
        previewBySessionId.get(session.id) ??
        null,
    })),
  );
}

export async function loadMobileChatSession(userId: string, sessionId: string) {
  const session = (
    await dbSelect<
      Array<{
        id: string;
        title: string | null;
        last_message_at: string | null;
      }>
    >(
      `chat_sessions?select=id,title,last_message_at&id=eq.${sessionId}&user_id=eq.${userId}&limit=1`,
    )
  )[0];

  if (!session) {
    return null;
  }

  const messages = await dbSelect<SessionMessageRow[]>(
    `chat_messages?select=id,role,parts,created_at&session_id=eq.${sessionId}&order=created_at.asc`,
  );

  return toChatSession(
    {
      id: session.id,
      title: session.title ?? "대화",
      last_message_at: session.last_message_at,
      last_message_preview: null,
    },
    messages.map((message) => ({
      id: message.id,
      role: message.role,
      parts: asParts(message.parts),
      created_at: message.created_at,
    })),
  );
}
