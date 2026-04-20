import { Hono } from "hono";
import { supabaseSelect } from "@gynecology-chatbot/mobile-api/supabase/admin-client";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "../../lib/session-auth.js";

const app = new Hono();

type KnowledgeRow = {
  id: string;
  slug: string;
  section: "knowledge" | "notebook";
  title: string;
  body: string;
  status: string;
};

app.get("/", async (c) => {
  try {
    await requireMobileSession(c);
    const target = c.req.query("target") ?? "";
    const entityId = c.req.query("entityId") ?? "";

    if (!target) {
      return c.json({ error: "target is required" }, 400);
    }

    const rows = entityId
      ? await supabaseSelect<KnowledgeRow[]>(
          `content_knowledge_items?select=id,slug,section,title,body,status&id=eq.${entityId}&limit=1`,
        )
      : await supabaseSelect<KnowledgeRow[]>(
          `content_knowledge_items?select=id,slug,section,title,body,status&section=eq.${target}&status=eq.published&limit=1`,
        );

    if (!rows[0]) {
      return c.json({ error: "link target not found" }, 404);
    }

    return c.json({
      content: {
        title: rows[0].title,
        section: rows[0].section,
        body: rows[0].body,
      },
    });
  } catch (error) {
    console.error("mobile link route error", error);
    return mobileRouteErrorResponse(c, error, "failed to load link target");
  }
});

export default app;
