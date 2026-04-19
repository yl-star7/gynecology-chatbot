import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { supabaseInsert, supabaseSelect } from "@/lib/supabase/admin-client";

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

type PersonaProfileRow = {
  user_id: string;
  persona_hint: PersonaHint;
  confidence: PersonaConfidence;
  evidence_summary: string | null;
  weighted_score: number | string;
  last_observed_at: string | null;
};

type PersonaSignalRow = {
  id: string;
  user_id: string;
  session_id: string | null;
  source_message_id: string | null;
  persona_hint: PersonaHint;
  confidence: PersonaConfidence;
  evidence: string | null;
  weight: number | string;
  observed_at: string;
  created_at: string;
};

function getPersonaWeight(confidence: PersonaConfidence) {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

function normalizePersonaProfile(row: PersonaProfileRow | undefined) {
  if (!row) return null;
  return {
    userId: row.user_id,
    personaHint: row.persona_hint,
    confidence: row.confidence,
    evidenceSummary: row.evidence_summary,
    weightedScore: Number(row.weighted_score),
    lastObservedAt: row.last_observed_at,
  };
}

function normalizePersonaSignal(row: PersonaSignalRow) {
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    sourceMessageId: row.source_message_id,
    personaHint: row.persona_hint,
    confidence: row.confidence,
    evidence: row.evidence,
    weight: Number(row.weight),
    observedAt: row.observed_at,
    createdAt: row.created_at,
  };
}

function parsePersonaHint(value: unknown): PersonaHint | null {
  if (typeof value !== "string" || !PERSONA_HINTS.has(value)) return null;
  return value as PersonaHint;
}

function parseConfidence(value: unknown): PersonaConfidence | null {
  if (typeof value !== "string" || !CONFIDENCE_VALUES.has(value)) return null;
  return value as PersonaConfidence;
}

export async function GET(request: NextRequest | Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId")?.trim();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const [profileRows, signalRows] = await Promise.all([
      supabaseSelect<PersonaProfileRow[]>(
        `v_user_persona_profiles?select=user_id,persona_hint,confidence,evidence_summary,weighted_score,last_observed_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
      ),
      supabaseSelect<PersonaSignalRow[]>(
        `user_persona_signals?select=id,user_id,session_id,source_message_id,persona_hint,confidence,evidence,weight,observed_at,created_at&user_id=eq.${encodeURIComponent(userId)}&order=observed_at.desc&limit=20`,
      ),
    ]);

    return NextResponse.json({
      profile: normalizePersonaProfile(profileRows[0]),
      signals: signalRows.map(normalizePersonaSignal),
    });
  } catch (error) {
    console.error("admin user persona get route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to load persona data",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest | Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
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
      return NextResponse.json(
        { error: "userId, personaHint, and confidence are required" },
        { status: 400 },
      );
    }

    const observedAt = new Date().toISOString();
    const inserted = await supabaseInsert<PersonaSignalRow[]>(
      "user_persona_signals",
      {
        user_id: userId,
        session_id: sessionId,
        source_message_id: sourceMessageId,
        persona_hint: personaHint,
        confidence,
        evidence,
        weight: getPersonaWeight(confidence),
        observed_at: observedAt,
        created_at: observedAt,
      },
    );

    return NextResponse.json({
      signal: inserted[0] ? normalizePersonaSignal(inserted[0]) : null,
    });
  } catch (error) {
    console.error("admin user persona post route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to create persona signal",
      },
      { status: 400 },
    );
  }
}
