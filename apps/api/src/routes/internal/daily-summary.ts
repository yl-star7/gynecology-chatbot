import { Hono } from "hono";

const app = new Hono();

function isAuthorized(authHeader: string | undefined) {
  return Boolean(
    process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`,
  );
}

app.post("/", async (c) => {
  try {
    if (!isAuthorized(c.req.header("authorization"))) {
      return c.json({ error: "unauthorized" }, 401);
    }

    return c.json(
      {
        ok: false,
        error:
          "daily summary migration endpoint placeholder — implement Cloud Run summary job here before enabling Cloud Scheduler",
      },
      501,
    );
  } catch (error) {
    console.error("internal daily-summary route error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "daily summary trigger failed",
      },
      500,
    );
  }
});

export default app;
