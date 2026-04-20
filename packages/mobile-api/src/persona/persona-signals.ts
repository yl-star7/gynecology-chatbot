import { createHash } from "crypto";

import type {
  PersonaConfidence,
  PersonaHint,
  ProfileMemoryPayload,
} from "../chat/workflow-payload";

export type PersonaSignalInput = {
  userId: string;
  sessionId?: string | null;
  sourceMessageId?: string | null;
  personaHint: PersonaHint;
  personaConfidence: PersonaConfidence;
  personaEvidence?: string | null;
  idempotencyKey?: string | null;
};

export type PersonaSignalRow = {
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

export const PERSONA_HINTS = new Set<PersonaHint>([
  "anxious",
  "positive",
  "introverted",
  "practical",
  "unknown",
]);

export const PERSONA_CONFIDENCE_VALUES = new Set<PersonaConfidence>([
  "low",
  "medium",
  "high",
]);

export function getPersonaSignalWeight(
  confidence: PersonaConfidence | null | undefined,
) {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

export function createPersonaSignalId(idempotencyKey: string) {
  const hash = createHash("sha256").update(idempotencyKey).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "5" + hash.slice(13, 16),
    "8" + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

export function normalizePersonaSignal(row: PersonaSignalRow) {
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

export function parsePersonaSignalInput(
  value: unknown,
): PersonaSignalInput | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const userId = typeof record.userId === "string" ? record.userId.trim() : "";
  const personaHint =
    typeof record.personaHint === "string" &&
    PERSONA_HINTS.has(record.personaHint as PersonaHint)
      ? (record.personaHint as PersonaHint)
      : null;
  const personaConfidence =
    typeof record.personaConfidence === "string" &&
    PERSONA_CONFIDENCE_VALUES.has(record.personaConfidence as PersonaConfidence)
      ? (record.personaConfidence as PersonaConfidence)
      : null;

  if (!userId || !personaHint || !personaConfidence) return null;

  return {
    userId,
    sessionId:
      typeof record.sessionId === "string" && record.sessionId.trim()
        ? record.sessionId.trim()
        : null,
    sourceMessageId:
      typeof record.sourceMessageId === "string" &&
      record.sourceMessageId.trim()
        ? record.sourceMessageId.trim()
        : null,
    personaHint,
    personaConfidence,
    personaEvidence:
      typeof record.personaEvidence === "string" &&
      record.personaEvidence.trim()
        ? record.personaEvidence.trim()
        : null,
    idempotencyKey:
      typeof record.idempotencyKey === "string" && record.idempotencyKey.trim()
        ? record.idempotencyKey.trim()
        : null,
  };
}

export function createPersonaSignalPayload(input: PersonaSignalInput) {
  const idempotencyKey =
    input.idempotencyKey ??
    [
      input.userId,
      input.sessionId ?? "",
      input.sourceMessageId ?? "",
      input.personaHint,
      input.personaConfidence,
      input.personaEvidence ?? "",
    ].join(":");
  const now = new Date().toISOString();

  return {
    id: createPersonaSignalId(idempotencyKey),
    user_id: input.userId,
    session_id: input.sessionId ?? null,
    source_message_id: input.sourceMessageId ?? null,
    persona_hint: input.personaHint,
    confidence: input.personaConfidence,
    evidence: input.personaEvidence ?? null,
    weight: getPersonaSignalWeight(input.personaConfidence),
    observed_at: now,
    created_at: now,
  };
}

export function createPersonaSignalInputFromProfileMemory(input: {
  userId: string;
  sessionId?: string | null;
  sourceMessageId?: string | null;
  nextProfileMemory: ProfileMemoryPayload | null | undefined;
  idempotencyKey?: string | null;
}) {
  const personaHint = input.nextProfileMemory?.personaHint;
  if (!personaHint || personaHint === "unknown") return null;
  const personaConfidence = input.nextProfileMemory?.personaConfidence ?? "low";
  return {
    userId: input.userId,
    sessionId: input.sessionId,
    sourceMessageId: input.sourceMessageId,
    personaHint,
    personaConfidence,
    personaEvidence: input.nextProfileMemory?.personaEvidence ?? null,
    idempotencyKey: input.idempotencyKey,
  } satisfies PersonaSignalInput;
}
