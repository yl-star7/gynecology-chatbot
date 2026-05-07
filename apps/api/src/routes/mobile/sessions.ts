import { Hono } from "hono";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import {
  MobileChatSessionNotFoundError,
  summarizeMobileChatSession,
} from "@gynecology-chatbot/mobile-api/chat/session-summary";
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

function toIsoString(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function asMessageParts(value: Prisma.JsonValue): MessagePreviewRow["parts"] {
  return Array.isArray(value) ? (value as MessagePreviewRow["parts"]) : null;
}

// GET /api/mobile/sessions
app.get("/", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const { userId } = await requireMobileSession(c, hintedUserId);

    const sessions = await prisma.chat_sessions.findMany({
      where: { user_id: userId },
      orderBy: [{ last_message_at: "desc" }],
      select: {
        id: true,
        title: true,
        last_message_at: true,
      },
    });

    const sessionIds = sessions.map((session) => session.id);
    const [latestMessages, summaryRows] =
      sessionIds.length > 0
        ? await Promise.all([
            prisma.chat_messages.findMany({
              where: {
                session_id: { in: sessionIds },
              },
              orderBy: [{ created_at: "desc" }],
              select: {
                session_id: true,
                plain_text: true,
                parts: true,
              },
            }),
            prisma.calendar_logs.findMany({
              where: {
                user_id: userId,
                session_id: { in: sessionIds },
                entry_type: "ai_summary",
              },
              orderBy: [{ created_at: "desc" }],
              select: {
                session_id: true,
                summary: true,
              },
            }),
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
      prisma.chat_sessions.findFirst({
        where: {
          id: sessionId,
          user_id: userId,
        },
        select: {
          id: true,
          title: true,
          last_message_at: true,
        },
      }),
      prisma.chat_messages.findMany({
        where: {
          session_id: sessionId,
        },
        orderBy: [{ created_at: "asc" }],
        select: {
          id: true,
          role: true,
          parts: true,
          created_at: true,
        },
      }),
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
          created_at: message.created_at.toISOString(),
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
