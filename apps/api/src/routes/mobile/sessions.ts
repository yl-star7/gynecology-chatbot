import { Hono } from "hono";
import { supabaseSelect } from "@gynecology-chatbot/mobile-api/supabase/admin-client";
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

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
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

// GET /api/mobile/sessions
app.get("/", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const { userId } = await requireMobileSession(c, hintedUserId);

    const sessions = await supabaseSelect<SessionRow[]>(
      `chat_sessions?select=id,title,last_message_at&user_id=eq.${userId}&order=last_message_at.desc.nullslast`,
    );

    const sessionIds = sessions.map((session) => session.id);
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

    return noStoreJson(c, {
      sessions: toRecentChats(
        sessions.map((session) => ({
          ...session,
          last_message_preview: previewBySessionId.get(session.id) ?? null,
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

    const [sessions, messages] = await Promise.all([
      supabaseSelect<
        Array<{ id: string; title: string; last_message_at: string | null }>
      >(
        `chat_sessions?select=id,title,last_message_at&id=eq.${sessionId}&user_id=eq.${userId}&limit=1`,
      ),
      supabaseSelect<
        Array<{
          id: string;
          role: "user" | "assistant" | "system";
          parts: never[];
          created_at: string;
        }>
      >(
        `chat_messages?select=id,role,parts,created_at&session_id=eq.${sessionId}&order=created_at.asc`,
      ),
    ]);

    if (!sessions[0]) {
      return c.json({ error: "session not found" }, 404);
    }

    return noStoreJson(c, {
      session: toChatSession(sessions[0], messages),
    });
  } catch (error) {
    console.error("mobile session detail route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load session");
  }
});

export default app;
