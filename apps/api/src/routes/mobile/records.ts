import { Hono } from "hono";
import {
  isValidEmotionTone,
  loadRecordDayView,
  recordEmotionCheckin,
} from "@gynecology-chatbot/mobile-api/records/record-day-route-helpers";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";

const app = new Hono();

app.get("/", async (c) => {
  try {
    const hintedUserId = c.req.query("userId") ?? null;
    const isoDate = c.req.query("date") ?? null;

    if (!isoDate) {
      return c.json({ error: "date is required" }, 400);
    }
    const { userId } = await requireMobileSession(c, hintedUserId);
    const recordDay = await loadRecordDayView(userId, isoDate);
    return c.json({ recordDay });
  } catch (error) {
    console.error("mobile records route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load day records");
  }
});

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const { userId } = await requireMobileSession(c, hintedUserId);

    const { sessionId, emotionTone } = body as {
      sessionId: string;
      emotionTone: string;
    };

    if (!isValidEmotionTone(emotionTone)) {
      return c.json(
        {
          error:
            "emotionTone must be one of: calm, joyful, anxious, tired, sad",
        },
        400,
      );
    }

    await recordEmotionCheckin({ userId, sessionId, emotionTone });

    return c.json({ ok: true });
  } catch (error) {
    console.error("mobile records POST route error", error);
    return mobileRouteErrorResponse(c, error, "failed to save emotion checkin");
  }
});

export default app;
