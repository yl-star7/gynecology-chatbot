import { Hono } from "hono";
import {
  MobileChatSessionNotFoundError,
  summarizeMobileChatSession,
} from "@gynecology-chatbot/mobile-api/chat/session-summary";
import { dbSelect } from "@gynecology-chatbot/mobile-api/db/admin-client";
import {
  resolveRecentChatPreview,
  toChatSession,
  toRecentChats,
} from "@gynecology-chatbot/mobile-api/serializers";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";
import { noStoreJson } from "../../lib/responses.js";

const app = new Hono();

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

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
};

type MessageRow = {
  id: string;
  role: string;
  parts: unknown;
  created_at: string;
};

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function asMessageParts(value: unknown): MessagePreviewRow["parts"] {
  return Array.isArray(value) ? (value as MessagePreviewRow["parts"]) : null;
}

// GET /api/mobile/sessions
app.get("/", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const { userId } = await requireMobileSession(c, hintedUserId);

    const sessions = await dbSelect<SessionRow[]>(
      `chat_sessions?select=id,title,last_message_at&user_id=eq.${userId}&order=last_message_at.desc`,
    );

    const sessionIds = sessions.map((session) => session.id);
    const [latestMessages, summaryRows] =
      sessionIds.length > 0
        ? await Promise.all([
            dbSelect<MessagePreviewRow[]>(
              `chat_messages?select=session_id,plain_text,parts&session_id=in.(${sessionIds.join(",")})&order=created_at.desc`,
            ),
            dbSelect<SessionSummaryRow[]>(
              `calendar_logs?select=session_id,summary&user_id=eq.${userId}&session_id=in.(${sessionIds.join(",")})&entry_type=eq.ai_summary&order=created_at.desc`,
            ),
          ])
        : [[], []];

    const summaryBySessionId = new Map<string, string>();
    for (const row of summaryRows as SessionSummaryRow[]) {
      if (!row.session_id || summaryBySessionId.has(row.session_id)) {
        continue;
      }

      const summary = row.summary?.replace(/\s+/g, " ").trim();
      if (summary) {
        summaryBySessionId.set(row.session_id, summary);
      }
    }

    const previewBySessionId = new Map<string, string>();
    for (const message of latestMessages) {
      if (previewBySessionId.has(message.session_id)) {
        continue;
      }

      const preview = resolveRecentChatPreview({
        plainText: message.plain_text,
        parts: asMessageParts(message.parts),
      });
      if (preview) {
        previewBySessionId.set(message.session_id, preview);
      }
    }

    return noStoreJson(c, {
      sessions: toRecentChats(
        sessions.map((session) => ({
          ...session,
          last_message_at: toIsoString(session.last_message_at),
          last_message_preview:
            summaryBySessionId.get(session.id) ??
            previewBySessionId.get(session.id) ??
            null,
        })),
      ),
    });
  } catch (error) {
    console.error("mobile sessions route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load sessions");
  }
});

// GET /api/mobile/sessions/:sessionId
app.get("/:sessionId", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const sessionId = c.req.param("sessionId");
    const { userId } = await requireMobileSession(c, hintedUserId);

    const [session, messages] = await Promise.all([
      dbSelect<SessionRow[]>(
        `chat_sessions?select=id,title,last_message_at&id=eq.${sessionId}&user_id=eq.${userId}&limit=1`,
      ).then((rows) => rows[0] ?? null),
      dbSelect<MessageRow[]>(
        `chat_messages?select=id,role,parts,created_at&session_id=eq.${sessionId}&order=created_at.asc`,
      ),
    ]);

    if (!session) {
      return c.json({ error: "session not found" }, 404);
    }

    return noStoreJson(c, {
      session: toChatSession(
        {
          ...session,
          last_message_at: toIsoString(session.last_message_at),
        },
        messages.map((message) => ({
          id: message.id,
          role: message.role as "user" | "assistant" | "system",
          parts: (Array.isArray(message.parts) ? message.parts : []) as never[],
          created_at: toIsoString(message.created_at) ?? "",
        })),
      ),
    });
  } catch (error) {
    console.error("mobile session detail route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load session");
  }
});

// POST /api/mobile/sessions/:sessionId/summarize
app.post("/:sessionId/summarize", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const sessionId = c.req.param("sessionId");
    const { userId } = await requireMobileSession(c, hintedUserId);

    const result = await summarizeMobileChatSession({ userId, sessionId });
    return noStoreJson(c, result);
  } catch (error) {
    if (error instanceof MobileChatSessionNotFoundError) {
      return c.json({ error: "session not found" }, 404);
    }
    console.error("mobile session summarize route error", error);
    return mobileRouteErrorResponse(c, error, "failed to summarize session");
  }
});

export default app;
