import { Hono } from "hono";
import { supabaseUpdate } from "@gynecology-chatbot/mobile-api/supabase/admin-client";
import { requireMobileSession } from "../../lib/session-auth.js";

const app = new Hono();

app.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const pushToken =
      typeof body.pushToken === "string" ? body.pushToken.trim() : "";

    if (!pushToken) {
      return c.json({ error: "pushToken is required" }, 400);
    }

    const { userId } = await requireMobileSession(c, "");

    await supabaseUpdate(`pregnancy_profiles?user_id=eq.${userId}`, {
      push_token: pushToken,
      updated_at: new Date().toISOString(),
    });

    return c.json({ ok: true });
  } catch (error) {
    console.error("push register error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "푸시 토큰 등록에 실패했습니다.",
      },
      500,
    );
  }
});

export default app;
