import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { mountMobileRoutes } from "./routes/index.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/_health", (c) => c.json({ ok: true }));
app.get("/livez", (c) => c.json({ ok: true }));
app.get("/readyz", (c) => c.json({ ok: true }));

mountMobileRoutes(app);

const port = Number(process.env.PORT ?? 8080);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on :${info.port}`);
});
