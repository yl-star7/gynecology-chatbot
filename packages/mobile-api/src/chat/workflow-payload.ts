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

export type WorkflowV2Stage = 0 | 1 | 2 | "free_chat" | "ended";

export type SessionMemoryPayload = {
  compactSummary?: string | null;
  lastScenario?: WorkflowScenario | null;
  lastCharacterTone?: CharacterTone | null;
  lastEmotionTone?: CharacterTone | null;
  workflowVersion?: number | null;
  stage?: WorkflowV2Stage | null;
  stageName?: string | null;
  moodId?: string | null;
  moodLabel?: string | null;
  ragContext?: string | null;
  ragContextWeek?: number | null;
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

export type WorkflowDeepLink = {
  title: string;
  description: string;
  target: "knowledge";
  entityId?: string;
  weekNumber?: number;
};

export type WorkflowAssistantPayload = {
  answer?: string;
  characterTone?: CharacterTone;
  guardrailStatus?: "safe" | "medical_caution" | "redirect";
  guardrailReason?: string;
  scenario?: WorkflowScenario;
  quickReplies?: WorkflowQuickReplyChoice[];
  deepLinks?: WorkflowDeepLink[];
  selectedChecklistIds?: string[];
  selectedQuestionIds?: string[];
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

function normalizeDeepLinks(value: unknown): WorkflowDeepLink[] | undefined {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!Array.isArray(value)) return undefined;
  const links = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title.trim() : "";
      const description =
        typeof record.description === "string" ? record.description.trim() : "";
      if (!title || !description || record.target !== "knowledge") return null;
      const link: WorkflowDeepLink = {
        title,
        description,
        target: "knowledge" as const,
      };
      if (
        typeof record.entityId === "string" &&
        uuidPattern.test(record.entityId.trim())
      ) {
        link.entityId = record.entityId.trim();
      }
      if (
        typeof record.weekNumber === "number" &&
        Number.isInteger(record.weekNumber) &&
        record.weekNumber >= 1 &&
        record.weekNumber <= 42
      ) {
        link.weekNumber = record.weekNumber;
      }
      return link;
    })
    .filter((v): v is WorkflowDeepLink => v !== null)
    .slice(0, 2);
  return links.length > 0 ? links : undefined;
}

function normalizeIdList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 5);
  return ids.length > 0 ? ids : undefined;
}

function findLastJsonObjectCandidate(value: string): string | null {
  for (let end = value.length - 1; end >= 0; end -= 1) {
    if (value[end] !== "}") continue;

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let start = end; start >= 0; start -= 1) {
      const char = value[start]!;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (char === "}") depth += 1;
      if (char === "{") {
        depth -= 1;
        if (depth === 0) {
          const candidate = value.slice(start, end + 1).trim();
          if (/"answer"\s*:/.test(candidate)) return candidate;
          break;
        }
      }
    }
  }
  return null;
}

function stripMalformedEmbeddedPayload(value: string) {
  const answerKeyIndex = value.indexOf('"answer"');
  if (answerKeyIndex < 0) return value.trim();

  const start = value.lastIndexOf("{", answerKeyIndex);
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) return value.trim();

  const candidate = value.slice(start, end + 1);
  const looksLikeWorkflowPayload =
    candidate.includes('"answer"') &&
    (candidate.includes('"scenario"') ||
      candidate.includes('"guardrailStatus"') ||
      candidate.includes('"nextSessionMemory"'));
  if (!looksLikeWorkflowPayload) return value.trim();

  const before = value
    .slice(0, start)
    .trimEnd()
    .replace(/```(?:json)?\s*$/i, "")
    .trim();
  const after = value
    .slice(end + 1)
    .trimStart()
    .replace(/^```\s*/i, "")
    .trim();
  return [before, after].filter(Boolean).join("\n\n").trim();
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
        : typeof outputs.text === "string"
          ? outputs.text
          : typeof outputs.result === "string"
            ? outputs.result
            : nestedText;

  const directPayload = {
    answer:
      typeof outputs.answer === "string"
        ? outputs.answer
        : typeof outputs.reply === "string"
          ? outputs.reply
          : typeof outputs.text === "string"
            ? outputs.text
            : typeof outputs.result === "string"
              ? outputs.result
              : (nestedText ?? undefined),
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
    deepLinks: normalizeDeepLinks(outputs.deepLinks),
    selectedChecklistIds: normalizeIdList(outputs.selectedChecklistIds),
    selectedQuestionIds: normalizeIdList(outputs.selectedQuestionIds),
  };

  if (
    directPayload.characterTone ||
    directPayload.guardrailStatus ||
    directPayload.guardrailReason ||
    directPayload.scenario ||
    directPayload.quickReplies ||
    directPayload.deepLinks ||
    directPayload.selectedChecklistIds ||
    directPayload.selectedQuestionIds ||
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

  const parseStructuredPayload = (source: string) => {
    const parsed = JSON.parse(source) as WorkflowAssistantPayload & {
      text?: unknown;
      answer?: unknown;
      quickReplies?: unknown;
      deepLinks?: unknown;
      selectedChecklistIds?: unknown;
      selectedQuestionIds?: unknown;
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
        deepLinks: normalizeDeepLinks(parsed.deepLinks),
        selectedChecklistIds: normalizeIdList(parsed.selectedChecklistIds),
        selectedQuestionIds: normalizeIdList(parsed.selectedQuestionIds),
      };
    }
    return null;
  };

  try {
    const payload = parseStructuredPayload(stripped);
    if (payload) return payload;
  } catch {
    const answerWithoutEmbeddedPayload =
      stripMalformedEmbeddedPayload(stripped);
    const embeddedJson = findLastJsonObjectCandidate(stripped);
    if (embeddedJson) {
      try {
        const payload = parseStructuredPayload(embeddedJson);
        if (payload) {
          return answerWithoutEmbeddedPayload &&
            answerWithoutEmbeddedPayload !== stripped
            ? { ...payload, answer: answerWithoutEmbeddedPayload }
            : payload;
        }
      } catch {
        if (
          answerWithoutEmbeddedPayload &&
          answerWithoutEmbeddedPayload !== stripped
        ) {
          return { answer: answerWithoutEmbeddedPayload };
        }
        // fall through to plain-answer handling below
      }
    }
  }

  try {
    return parseStructuredPayload(stripped);
  } catch {
    const isPlainAnswerOutput =
      typeof outputs.answer === "string" ||
      typeof outputs.reply === "string" ||
      typeof outputs.text === "string" ||
      typeof outputs.result === "string" ||
      typeof nestedText === "string";
    if (!isPlainAnswerOutput) return null;
    const sanitized = stripMalformedEmbeddedPayload(stripped);
    return sanitized ? { answer: sanitized } : null;
  }

  return null;
}
