import { Hono } from "hono";
import { prisma } from "@gynecology-chatbot/db/prisma";

import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

const PERSONA_HINTS = new Set([
  "anxious",
  "positive",
  "introverted",
  "practical",
  "unknown",
]);
const CONFIDENCE_VALUES = new Set(["low", "medium", "high"]);

type PersonaHint = "anxious" | "positive" | "introverted" | "practical" | "unknown";
type PersonaConfidence = "low" | "medium" | "high";

function getPersonaWeight(confidence: PersonaConfidence) {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

function parsePersonaHint(value: unknown): PersonaHint | null {
  if (typeof value !== "string" || !PERSONA_HINTS.has(value)) return null;
  return value as PersonaHint;
}

function parseConfidence(value: unknown): PersonaConfidence | null {
  if (typeof value !== "string" || !CONFIDENCE_VALUES.has(value)) return null;
  return value as PersonaConfidence;
}

app.get("/users/persona", async (c) => {
  try {
    const userId = c.req.query("userId")?.trim();
    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }

    const signalRows = await prisma.user_persona_signals.findMany({
      where: { user_id: userId },
      orderBy: { observed_at: "desc" },
      take: 20,
    });

    const latestSignal = signalRows[0];
    const weightedScore =
      signalRows.reduce((sum, signal) => sum + Number(signal.weight), 0) /
      Math.max(1, signalRows.length);
    const profile = latestSignal
      ? {
          userId: latestSignal.user_id,
          personaHint: latestSignal.persona_hint,
          confidence: latestSignal.confidence,
          evidenceSummary: latestSignal.evidence,
          weightedScore,
          lastObservedAt: latestSignal.observed_at.toISOString(),
        }
      : null;

    return c.json({
      profile,
      signals: signalRows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        sessionId: row.session_id,
        sourceMessageId: row.source_message_id,
        personaHint: row.persona_hint,
        confidence: row.confidence,
        evidence: row.evidence,
        weight: Number(row.weight),
        observedAt: row.observed_at.toISOString(),
        createdAt: row.created_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error("admin api user persona get error", error);
    return c.json(
      { error: error instanceof Error ? error.message : "failed to load persona data" },
      400,
    );
  }
});

app.post("/users/persona", async (c) => {
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const personaHint = parsePersonaHint(body.personaHint);
    const confidence = parseConfidence(body.confidence);
    const evidence =
      typeof body.evidence === "string" && body.evidence.trim()
        ? body.evidence.trim()
        : null;
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim()
        : null;
    const sourceMessageId =
      typeof body.sourceMessageId === "string" && body.sourceMessageId.trim()
        ? body.sourceMessageId.trim()
        : null;

    if (!userId || !personaHint || !confidence) {
      return c.json({ error: "userId, personaHint, and confidence are required" }, 400);
    }

    const inserted = await prisma.user_persona_signals.create({
      data: {
        user_id: userId,
        session_id: sessionId,
        source_message_id: sourceMessageId,
        persona_hint: personaHint,
        confidence,
        evidence,
        weight: getPersonaWeight(confidence),
        observed_at: new Date(),
      },
    });

    return c.json({
      signal: {
        id: inserted.id,
        userId: inserted.user_id,
        sessionId: inserted.session_id,
        sourceMessageId: inserted.source_message_id,
        personaHint: inserted.persona_hint,
        confidence: inserted.confidence,
        evidence: inserted.evidence,
        weight: Number(inserted.weight),
        observedAt: inserted.observed_at.toISOString(),
        createdAt: inserted.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("admin api user persona post error", error);
    return c.json(
      { error: error instanceof Error ? error.message : "failed to create persona signal" },
      400,
    );
  }
});

export default app;
