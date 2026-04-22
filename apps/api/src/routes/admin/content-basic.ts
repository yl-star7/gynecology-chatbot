import { randomUUID } from "crypto";
import { Hono } from "hono";
import type { Prisma } from "@gynecology-chatbot/db/prisma";
import { prisma } from "@gynecology-chatbot/db/prisma";

import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

const VALID_QUESTION_TYPES = new Set([
  "text",
  "single_choice",
  "multi_choice",
  "yes_no",
  "number",
]);

function optionalDayNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value >= 1 && value <= 7 ? value : null;
}

app.get("/content/checklists", async (c) => {
  try {
    const weekDataId = c.req.query("weekDataId");
    const rows = await prisma.content_week_checklists.findMany({
      where: weekDataId ? { week_data_id: weekDataId } : undefined,
      orderBy: [
        { week_data_id: "asc" },
        { day_number: "asc" },
        { display_order: "asc" },
      ],
    });

    return c.json({ checklists: rows });
  } catch (error) {
    console.error("admin api checklists GET error", error);
    return c.json({ error: "failed to load checklists" }, 500);
  }
});

app.post("/content/checklists", async (c) => {
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const weekDataId = typeof body.weekDataId === "string" ? body.weekDataId.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!weekDataId || !code || !title) {
      return c.json({ error: "invalid checklist payload" }, 400);
    }

    const row = await prisma.content_week_checklists.create({
      data: {
        id: randomUUID(),
        week_data_id: weekDataId,
        day_number: optionalDayNumber(body.dayNumber),
        code,
        title,
        description:
          typeof body.description === "string" && body.description.trim()
            ? body.description.trim()
            : null,
        checklist_payload:
          body.checklistPayload &&
          typeof body.checklistPayload === "object" &&
          !Array.isArray(body.checklistPayload)
            ? (body.checklistPayload as Prisma.InputJsonValue)
            : {},
        display_order:
          typeof body.displayOrder === "number" ? body.displayOrder : 0,
        is_required:
          typeof body.isRequired === "boolean" ? body.isRequired : false,
        is_active: typeof body.isActive === "boolean" ? body.isActive : true,
      },
    });

    return c.json({ checklist: row }, 201);
  } catch (error) {
    console.error("admin api checklists POST error", error);
    return c.json({ error: "failed to create checklist" }, 500);
  }
});

app.get("/content/questions", async (c) => {
  try {
    const weekDataId = c.req.query("weekDataId");
    const rows = await prisma.content_week_questions.findMany({
      where: weekDataId ? { week_data_id: weekDataId } : undefined,
      orderBy: [
        { week_data_id: "asc" },
        { day_number: "asc" },
        { display_order: "asc" },
      ],
    });

    return c.json({ questions: rows });
  } catch (error) {
    console.error("admin api questions GET error", error);
    return c.json({ error: "failed to load questions" }, 500);
  }
});

app.post("/content/questions", async (c) => {
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const weekDataId = typeof body.weekDataId === "string" ? body.weekDataId.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const questionText =
      typeof body.questionText === "string" ? body.questionText.trim() : "";
    if (!weekDataId || !code || !questionText) {
      return c.json({ error: "invalid question payload" }, 400);
    }

    const questionType =
      typeof body.questionType === "string" && VALID_QUESTION_TYPES.has(body.questionType)
        ? body.questionType
        : "text";
    const row = await prisma.content_week_questions.create({
      data: {
        id: randomUUID(),
        week_data_id: weekDataId,
        day_number: optionalDayNumber(body.dayNumber),
        code,
        question_text: questionText,
        question_type: questionType,
        help_text:
          typeof body.helpText === "string" && body.helpText.trim()
            ? body.helpText.trim()
            : null,
        question_payload:
          body.questionPayload &&
          typeof body.questionPayload === "object" &&
          !Array.isArray(body.questionPayload)
            ? (body.questionPayload as Prisma.InputJsonValue)
            : {},
        display_order:
          typeof body.displayOrder === "number" ? body.displayOrder : 0,
        is_required:
          typeof body.isRequired === "boolean" ? body.isRequired : false,
        is_active: typeof body.isActive === "boolean" ? body.isActive : true,
      },
    });

    return c.json({ question: row }, 201);
  } catch (error) {
    console.error("admin api questions POST error", error);
    return c.json({ error: "failed to create question" }, 500);
  }
});

export default app;
