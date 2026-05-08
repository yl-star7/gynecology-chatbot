import { Hono } from "hono";
import {
  MobileChatSessionNotFoundError,
  summarizeMobileChatSession,
} from "@gynecology-chatbot/mobile-api/chat/session-summary";
import {
  loadMobileChatSession,
  loadMobileChatSessions,
} from "@gynecology-chatbot/mobile-api/chat/session-route-helpers";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";
import { noStoreJson } from "../../lib/responses.js";

const app = new Hono();

// GET /api/mobile/sessions
app.get("/", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const { userId } = await requireMobileSession(c, hintedUserId);
    const sessions = await loadMobileChatSessions(userId);

    return noStoreJson(c, {
      sessions,
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
    const session = await loadMobileChatSession(userId, sessionId);

    if (!session) {
      return c.json({ error: "session not found" }, 404);
    }

    return noStoreJson(c, {
      session,
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
