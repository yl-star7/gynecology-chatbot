import { Hono } from "hono";
import { prisma } from "@gynecology-chatbot/db/prisma";
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

    await prisma.pregnancy_profiles.updateMany({
      where: { user_id: userId },
      data: {
        push_token: pushToken,
        updated_at: new Date(),
      },
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
