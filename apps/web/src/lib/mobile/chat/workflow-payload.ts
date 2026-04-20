export type CharacterTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

export type PersonaHint =
  | "anxious"
  | "positive"
  | "introverted"
  | "practical"
  | "unknown";

export type PersonaConfidence = "low" | "medium" | "high";

export type WorkflowScenario =
  | "emotion_checkin"
  | "emotion_reason"
  | "baby_info_offer"
  | "baby_info"
  | "mother_info"
  | "checklist"
  | "attachment_question"
  | "letter_reflection"
  | "daily_followup"
  | "empathy_chat"
  | "week_info"
  | "symptom_counsel"
  | "general";

export type SessionMemoryPayload = {
  compactSummary?: string | null;
  lastScenario?: WorkflowScenario | null;
  lastCharacterTone?: CharacterTone | null;
  lastEmotionTone?: CharacterTone | null;
  updatedAt?: string | null;
};

export type ProfileMemoryPayload = {
  lastEmotionTone?: CharacterTone | null;
  personaHint?: PersonaHint | null;
  personaConfidence?: PersonaConfidence | null;
  personaEvidence?: string | null;
  updatedAt?: string | null;
};

export type WorkflowQuickReplyChoice = {
  label: string;
  message: string;
};

export type WorkflowAssistantPayload = {
  answer?: string;
  characterTone?: CharacterTone;
  guardrailStatus?: "safe" | "medical_caution" | "redirect";
  guardrailReason?: string;
  scenario?: WorkflowScenario;
  quickReplies?: WorkflowQuickReplyChoice[];
  nextSessionMemory?: SessionMemoryPayload;
  nextProfileMemory?: ProfileMemoryPayload;
};

function normalizeQuickReplies(
  value: unknown,
): WorkflowQuickReplyChoice[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const choices = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const label = typeof record.label === "string" ? record.label.trim() : "";
      if (!label) return null;
      const message =
        typeof record.message === "string" && record.message.trim()
          ? record.message.trim()
          : label;
      return { label, message };
    })
    .filter((v): v is WorkflowQuickReplyChoice => v !== null)
    .slice(0, 5);
  return choices.length > 0 ? choices : undefined;
}

export function parseWorkflowAssistantPayload(
  outputs: Record<string, unknown> | undefined,
): WorkflowAssistantPayload | null {
  if (!outputs) {
    return null;
  }

  // Schift workflow는 { result: { text: "...", usage: {...} } } 형태로 반환한다
  const nestedResult =
    outputs.result && typeof outputs.result === "object"
      ? (outputs.result as Record<string, unknown>)
      : null;
  const nestedText =
    typeof nestedResult?.text === "string"
      ? nestedResult.text
      : typeof nestedResult?.answer === "string"
        ? nestedResult.answer
        : null;

  const directAnswer =
    typeof outputs.answer === "string"
      ? outputs.answer
      : typeof outputs.reply === "string"
        ? outputs.reply
        : typeof outputs.result === "string"
          ? outputs.result
          : nestedText;

  const directPayload = {
    answer:
      typeof outputs.answer === "string"
        ? outputs.answer
        : typeof outputs.reply === "string"
          ? outputs.reply
          : typeof outputs.result === "string"
            ? outputs.result
            : undefined,
    characterTone:
      typeof outputs.characterTone === "string"
        ? (outputs.characterTone as CharacterTone)
        : undefined,
    guardrailStatus:
      typeof outputs.guardrailStatus === "string"
        ? (outputs.guardrailStatus as WorkflowAssistantPayload["guardrailStatus"])
        : undefined,
    guardrailReason:
      typeof outputs.guardrailReason === "string"
        ? outputs.guardrailReason
        : undefined,
    scenario:
      typeof outputs.scenario === "string"
        ? (outputs.scenario as WorkflowScenario)
        : undefined,
    quickReplies: normalizeQuickReplies(outputs.quickReplies),
  };

  if (
    directPayload.characterTone ||
    directPayload.guardrailStatus ||
    directPayload.guardrailReason ||
    directPayload.scenario ||
    directPayload.quickReplies ||
    (outputs.nextSessionMemory &&
      typeof outputs.nextSessionMemory === "object") ||
    (outputs.nextProfileMemory && typeof outputs.nextProfileMemory === "object")
  ) {
    return {
      ...directPayload,
      nextSessionMemory:
        outputs.nextSessionMemory &&
        typeof outputs.nextSessionMemory === "object"
          ? (outputs.nextSessionMemory as SessionMemoryPayload)
          : undefined,
      nextProfileMemory:
        outputs.nextProfileMemory &&
        typeof outputs.nextProfileMemory === "object"
          ? (outputs.nextProfileMemory as ProfileMemoryPayload)
          : undefined,
    };
  }

  if (!directAnswer) {
    return null;
  }

  // LLM이 ```json ... ``` 으로 감싸는 경우 제거
  const stripped = directAnswer
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(stripped) as WorkflowAssistantPayload & {
      text?: unknown;
      answer?: unknown;
      quickReplies?: unknown;
    };
    if (
      typeof parsed.text === "string" &&
      !("characterTone" in parsed) &&
      !("guardrailStatus" in parsed) &&
      !("nextSessionMemory" in parsed)
    ) {
      return (
        parseWorkflowAssistantPayload({ answer: parsed.text }) ??
        (parsed.text.trim() ? { answer: parsed.text.trim() } : null)
      );
    }

    if (
      (typeof parsed.answer === "string" && parsed.answer.trim()) ||
      typeof parsed.characterTone === "string" ||
      typeof parsed.guardrailStatus === "string" ||
      typeof parsed.nextSessionMemory === "object" ||
      typeof parsed.nextProfileMemory === "object"
    ) {
      return {
        ...parsed,
        quickReplies: normalizeQuickReplies(parsed.quickReplies),
      };
    }
  } catch {
    const isPlainAnswerOutput =
      typeof outputs.answer === "string" ||
      typeof outputs.reply === "string" ||
      typeof outputs.result === "string";
    return isPlainAnswerOutput ? { answer: stripped } : null;
  }

  return null;
}
