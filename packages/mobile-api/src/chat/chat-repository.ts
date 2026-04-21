import { dbInsert, dbSelect, dbUpdate } from "../db/admin-client";
import {
  createKoreanDateKey,
  resolvePregnancyPositionFromProfile,
} from "@gynecology-chatbot/app-core/time";
import type {
  PersonaConfidence,
  PersonaHint,
  ProfileMemoryPayload,
  SessionMemoryPayload,
} from "./workflow-payload";

type PregnancyProfilePromptRow = {
  pregnancy_day_count: number | null;
  pregnancy_week: number | null;
  pregnancy_day_in_week: number | null;
  baby_nickname: string | null;
  display_name: string | null;
  due_date: string | null;
  onboarding_payload: {
    tonePreference?: string | null;
    profileMemory?: ProfileMemoryPayload | null;
  } | null;
};

export type WeekDataRow = {
  id: string;
  week_number: number;
  title: string | null;
  baby_summary: string | null;
  mother_summary: string | null;
  warning_signs: string | null;
  recommended_actions: string | null;
  checklist_intro: string | null;
  question_intro: string | null;
  status: "draft" | "published" | "archived";
};

export type DayContentRow = {
  id: string;
  day_number: number;
  title: string | null;
  baby_development_payload: { items?: string[] } | null;
  baby_message: string | null;
  mother_changes_payload: { items?: string[] } | null;
};

export type ChecklistRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  checklist_payload: {
    items?: Array<{ id?: string; label?: string }>;
    rawText?: string;
  } | null;
  display_order: number;
  is_required: boolean;
};

export type QuestionRow = {
  id: string;
  code: string;
  question_text: string;
  question_type:
    | "text"
    | "single_choice"
    | "multi_choice"
    | "yes_no"
    | "number";
  help_text: string | null;
  question_payload: {
    choices?: Array<{ id?: string; label?: string }>;
    yesLabel?: string;
    noLabel?: string;
    rawText?: string;
  } | null;
  display_order: number;
  is_required: boolean;
};

type UserChecklistEventRow = {
  id: string;
  checklist_id: string;
  status: "sent" | "opened" | "completed" | "skipped";
};

type UserQuestionEventRow = {
  id: string;
  question_id: string;
  status: "sent" | "opened" | "answered" | "skipped";
};

type PromptQuestionLookupRow = {
  id: string;
  question_text: string;
};

type CalendarQuestionResponseRow = {
  id: string;
  payload: {
    questionId?: string | null;
  } | null;
};

type UserPersonaProfileRow = {
  user_id: string;
  persona_hint: PersonaHint;
  confidence: PersonaConfidence;
  evidence_summary: string | null;
  weighted_score: number;
  last_observed_at: string | null;
};

export type PromptContext = {
  pregnancyWeek: number;
  dayNumber: number;
  week: WeekDataRow;
  dayContent: DayContentRow | null;
  checklists: ChecklistRow[];
  questions: QuestionRow[];
  tonePreference: string | null;
  profileMemory: ProfileMemoryPayload | null;
  sessionMemory: SessionMemoryPayload | null;
  onboardingPayload: PregnancyProfilePromptRow["onboarding_payload"];
  missingFields: string[];
};

function getKstDateKey(now = new Date()) {
  return createKoreanDateKey(now);
}

function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function toIsoStringOrNull(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function asObject<T>(value: unknown): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}

function mapPregnancyProfileRow(
  row: {
    pregnancy_day_count: number;
    pregnancy_week: number | null;
    pregnancy_day_in_week: number | null;
    baby_nickname: string | null;
    display_name: string | null;
    due_date: Date | string | null;
    onboarding_payload: unknown;
  } | null,
): PregnancyProfilePromptRow | null {
  if (!row) {
    return null;
  }

  return {
    pregnancy_day_count: row.pregnancy_day_count,
    pregnancy_week: row.pregnancy_week,
    pregnancy_day_in_week: row.pregnancy_day_in_week,
    baby_nickname: row.baby_nickname,
    display_name: row.display_name,
    due_date: formatDateOnly(row.due_date),
    onboarding_payload: asObject<
      PregnancyProfilePromptRow["onboarding_payload"]
    >(row.onboarding_payload),
  };
}

function mapWeekDataRow(
  row: {
    id: string;
    week_number: number;
    title: string | null;
    baby_summary: string | null;
    mother_summary: string | null;
    warning_signs: string | null;
    recommended_actions: string | null;
    checklist_intro: string | null;
    question_intro: string | null;
    status: string;
  } | null,
): WeekDataRow | null {
  if (!row) {
    return null;
  }

  return {
    ...row,
    status: row.status as WeekDataRow["status"],
  };
}

function mapDayContentRow(
  row: {
    id: string;
    day_number: number;
    title: string | null;
    baby_development_payload: unknown;
    baby_message: string | null;
    mother_changes_payload: unknown;
  } | null,
): DayContentRow | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    day_number: row.day_number,
    title: row.title,
    baby_development_payload: asObject<
      DayContentRow["baby_development_payload"]
    >(row.baby_development_payload),
    baby_message: row.baby_message,
    mother_changes_payload: asObject<DayContentRow["mother_changes_payload"]>(
      row.mother_changes_payload,
    ),
  };
}

function mapChecklistRow(row: {
  id: string;
  code: string;
  title: string;
  description: string | null;
  checklist_payload: unknown;
  display_order: number;
  is_required: boolean;
}): ChecklistRow {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    checklist_payload: asObject<ChecklistRow["checklist_payload"]>(
      row.checklist_payload,
    ),
    display_order: row.display_order,
    is_required: row.is_required,
  };
}

function mapQuestionRow(row: {
  id: string;
  code: string;
  question_text: string;
  question_type: string;
  help_text: string | null;
  question_payload: unknown;
  display_order: number;
  is_required: boolean;
}): QuestionRow {
  return {
    id: row.id,
    code: row.code,
    question_text: row.question_text,
    question_type: row.question_type as QuestionRow["question_type"],
    help_text: row.help_text,
    question_payload: asObject<QuestionRow["question_payload"]>(
      row.question_payload,
    ),
    display_order: row.display_order,
    is_required: row.is_required,
  };
}

function mapPersonaProfileRow(
  row: {
    user_id: string | null;
    persona_hint: string | null;
    confidence: string | null;
    evidence_summary: string | null;
    weighted_score: { toNumber(): number } | number | string | null;
    last_observed_at: Date | string | null;
  } | null,
): UserPersonaProfileRow | null {
  if (!row?.user_id || !row.persona_hint || !row.confidence) {
    return null;
  }

  const weightedScore =
    typeof row.weighted_score === "number"
      ? row.weighted_score
      : typeof row.weighted_score === "string"
        ? Number(row.weighted_score)
        : (row.weighted_score?.toNumber() ?? 0);

  return {
    user_id: row.user_id,
    persona_hint: row.persona_hint as PersonaHint,
    confidence: row.confidence as PersonaConfidence,
    evidence_summary: row.evidence_summary,
    weighted_score: Number.isFinite(weightedScore) ? weightedScore : 0,
    last_observed_at: toIsoStringOrNull(row.last_observed_at),
  };
}

function normalizeForPromptMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCharBigrams(value: string) {
  const compact = normalizeForPromptMatch(value).replace(/\s+/g, "");
  const result = new Set<string>();
  for (let index = 0; index < compact.length - 1; index += 1) {
    result.add(compact.slice(index, index + 2));
  }
  return result;
}

function scorePromptSimilarity(input: string, prompt: string) {
  const normalizedInput = normalizeForPromptMatch(input);
  const normalizedPrompt = normalizeForPromptMatch(prompt);
  if (!normalizedInput || !normalizedPrompt) return 0;
  if (
    normalizedInput === normalizedPrompt ||
    normalizedInput.includes(normalizedPrompt) ||
    normalizedPrompt.includes(normalizedInput)
  ) {
    return 1;
  }

  const inputBigrams = getCharBigrams(normalizedInput);
  const promptBigrams = getCharBigrams(normalizedPrompt);
  if (inputBigrams.size === 0 || promptBigrams.size === 0) return 0;
  let overlap = 0;
  for (const token of inputBigrams) {
    if (promptBigrams.has(token)) overlap += 1;
  }
  const dice = (2 * overlap) / (inputBigrams.size + promptBigrams.size);

  const valueAnswerHints =
    /성실|정직|배려|사랑|책임|용기|건강|행복|가치|태도/.test(normalizedInput);
  const valueQuestionHints = /가치|태도|사람|자라|물려/.test(normalizedPrompt);
  const teachingAnswerHints = /가르|알려|배우|습관|인사|공부|말|방법/.test(
    normalizedInput,
  );
  const teachingQuestionHints = /가르|알려|배우|먼저/.test(normalizedPrompt);
  const semanticBoost =
    (valueAnswerHints && valueQuestionHints) ||
    (teachingAnswerHints && teachingQuestionHints)
      ? 0.35
      : 0;

  return Math.min(1, dice + semanticBoost);
}

function resolveOrdinalSelectionIndex(text: string) {
  const normalized = normalizeForPromptMatch(text);
  if (/^(1|1번|첫|첫번|첫번째|첫 번째)/.test(normalized)) return 0;
  if (/^(2|2번|둘|두번|두번째|두 번째)/.test(normalized)) return 1;
  if (/첫.*질문|첫째.*질문/.test(normalized)) return 0;
  if (/두.*질문|둘째.*질문/.test(normalized)) return 1;
  return null;
}

async function loadPromptQuestionsById(questionIds: string[]) {
  if (questionIds.length === 0)
    return new Map<string, PromptQuestionLookupRow>();
  const rows = await dbSelect<PromptQuestionLookupRow[]>(
    `content_week_questions?select=id,question_text&id=in.(${questionIds.join(",")})`,
  );
  return new Map(rows.map((row) => [row.id, row]));
}

function resolveBestQuestionEventMatch(input: {
  events: UserQuestionEventRow[];
  questionsById: Map<string, PromptQuestionLookupRow>;
  userMessageText: string;
}) {
  const ordinal = resolveOrdinalSelectionIndex(input.userMessageText);
  if (ordinal !== null && input.events[ordinal]) {
    return {
      event: input.events[ordinal],
      mode: "opened" as const,
      score: 1,
    };
  }

  const scored = input.events
    .map((event) => {
      const question = input.questionsById.get(event.question_id);
      return {
        event,
        question,
        score: question
          ? scorePromptSimilarity(input.userMessageText, question.question_text)
          : 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 0.25) return null;

  const normalizedInput = normalizeForPromptMatch(input.userMessageText);
  const normalizedQuestion = normalizeForPromptMatch(
    best.question?.question_text ?? "",
  );
  const mode =
    best.score > 0.9 ||
    normalizedInput.includes("질문") ||
    normalizedInput === normalizedQuestion
      ? "opened"
      : "answered";

  return { event: best.event, mode, score: best.score };
}

async function syncAnsweredQuestionToCalendar(input: {
  userId: string;
  sessionId: string;
  questionEventId: string;
  questionId: string;
  userMessageId: string | null;
  userMessageText: string;
  answeredAt: string;
}) {
  const todayDate = getKstDateKey();
  const answerText = input.userMessageText.trim();
  const summary = answerText || "답변을 남겼어요.";
  const existingRows = await dbSelect<CalendarQuestionResponseRow[]>(
    `calendar_logs?select=id,payload&user_id=eq.${input.userId}&date=eq.${todayDate}&entry_type=eq.survey_response`,
  );
  const existingRow = existingRows
    .map((row) => ({
      id: row.id,
      payload: asObject<CalendarQuestionResponseRow["payload"]>(row.payload),
    }))
    .find((row) => row.payload?.questionId === input.questionId);
  const payload = {
    source: "chat_question_answer",
    questionId: input.questionId,
    answer: answerText,
    answerMessageId: input.userMessageId,
    eventId: input.questionEventId,
    answeredAt: input.answeredAt,
  };

  if (existingRow) {
    await dbUpdate(`calendar_logs?id=eq.${existingRow.id}`, {
      session_id: input.sessionId,
      title: "하루 질문 답변",
      summary,
      payload,
    });
    return;
  }

  await dbInsert("calendar_logs", {
    user_id: input.userId,
    session_id: input.sessionId,
    date: todayDate,
    entry_type: "survey_response",
    title: "하루 질문 답변",
    summary,
    payload,
  });
}

function resolveSelectedPregnancyPosition(
  profile: PregnancyProfilePromptRow,
  isoDate: string,
) {
  return resolvePregnancyPositionFromProfile(
    {
      pregnancyDayCount: profile.pregnancy_day_count,
      pregnancyWeek: profile.pregnancy_week,
      pregnancyDayInWeek: profile.pregnancy_day_in_week,
      dueDate: profile.due_date,
    },
    isoDate,
    isoDate,
  );
}

export async function getPromptContext(
  userId: string,
  hintedPregnancyWeek: number | null,
  sessionId: string | null,
): Promise<PromptContext | null> {
  const [profileRow, sessionRow, personaProfileRow] = await Promise.all([
    dbSelect<
      Array<{
        pregnancy_day_count: number;
        pregnancy_week: number | null;
        pregnancy_day_in_week: number | null;
        baby_nickname: string | null;
        display_name: string | null;
        due_date: string | null;
        onboarding_payload: unknown;
      }>
    >(
      `pregnancy_profiles?select=pregnancy_day_count,pregnancy_week,pregnancy_day_in_week,baby_nickname,display_name,due_date,onboarding_payload&user_id=eq.${userId}&limit=1`,
    ).then((rows) => rows[0] ?? null),
    sessionId
      ? dbSelect<
          Array<{
            id: string;
            title: string | null;
            memory_payload: unknown;
          }>
        >(
          `chat_sessions?select=id,title,memory_payload&id=eq.${sessionId}&user_id=eq.${userId}&limit=1`,
        ).then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    dbSelect<
      Array<{
        user_id: string | null;
        persona_hint: string | null;
        confidence: string | null;
        evidence_summary: string | null;
        weighted_score: number | null;
        last_observed_at: string | null;
      }>
    >(
      `v_user_persona_profiles?select=user_id,persona_hint,confidence,evidence_summary,weighted_score,last_observed_at&user_id=eq.${userId}&limit=1`,
    ).then((rows) => rows[0] ?? null),
  ]);

  const profile = mapPregnancyProfileRow(profileRow);
  const todayIsoDate = getKstDateKey();
  const position = profile
    ? resolveSelectedPregnancyPosition(profile, todayIsoDate)
    : null;
  const pregnancyWeek = position?.weekNumber ?? hintedPregnancyWeek ?? null;
  const dayNumber = position?.dayNumber ?? null;
  if (!pregnancyWeek || !dayNumber) {
    return null;
  }

  const week = mapWeekDataRow(
    (
      await dbSelect<
        Array<{
          id: string;
          week_number: number;
          title: string | null;
          baby_summary: string | null;
          mother_summary: string | null;
          warning_signs: string | null;
          recommended_actions: string | null;
          checklist_intro: string | null;
          question_intro: string | null;
          status: string;
        }>
      >(
        `content_pregnancy_week_data?select=id,week_number,title,baby_summary,mother_summary,warning_signs,recommended_actions,checklist_intro,question_intro,status&week_number=eq.${pregnancyWeek}&status=eq.published&limit=1`,
      )
    )[0] ?? null,
  );
  if (!week) {
    return null;
  }

  const [
    dayContentRow,
    datedQuestionRow,
    genericQuestionRow,
  ] = await Promise.all([
    dbSelect<DayContentRow[]>(
      `content_pregnancy_day_contents?select=id,day_number,title,baby_development_payload,baby_message,mother_changes_payload&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&limit=1`,
    ).then((rows) => rows[0] ?? null),
    dbSelect<QuestionRow[]>(
      `content_week_questions?select=id,code,question_text,question_type,help_text,question_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc&limit=1`,
    ).then((rows) => rows[0] ?? null),
    dbSelect<QuestionRow[]>(
      `content_week_questions?select=id,code,question_text,question_type,help_text,question_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc&limit=1`,
    ).then((rows) => rows[0] ?? null),
  ]);

  const questions = datedQuestionRow
    ? [mapQuestionRow(datedQuestionRow)]
    : genericQuestionRow
      ? [mapQuestionRow(genericQuestionRow)]
      : [];

  const personaProfile = mapPersonaProfileRow(personaProfileRow);
  const profileMemory = {
    ...(profile?.onboarding_payload?.profileMemory ?? {}),
    ...(personaProfile
      ? {
          personaHint: personaProfile.persona_hint,
          personaConfidence: personaProfile.confidence,
          personaEvidence: personaProfile.evidence_summary,
        }
      : {}),
  };
  const missingFields: string[] = [];
  if (!profile?.baby_nickname) missingFields.push("태명");
  if (!profile?.due_date) missingFields.push("출산 예정일");
  if (!profile?.display_name || profile.display_name === "사용자") {
    missingFields.push("이름");
  }

  return {
    pregnancyWeek,
    dayNumber,
    week,
    dayContent: mapDayContentRow(dayContentRow),
    checklists: [],
    questions,
    tonePreference: profile?.onboarding_payload?.tonePreference ?? null,
    profileMemory: Object.keys(profileMemory).length > 0 ? profileMemory : null,
    sessionMemory: asObject<SessionMemoryPayload>(sessionRow?.memory_payload),
    onboardingPayload: profile?.onboarding_payload ?? null,
    missingFields,
  };
}

export async function markOutstandingPromptEventsAnswered(input: {
  userId: string;
  sessionId: string;
  userMessageId: string | null;
  userMessageText: string;
}): Promise<{ answeredCount: number }> {
  const questionEvents = await dbSelect<UserQuestionEventRow[]>(
    `user_question_events?select=id,question_id,status&user_id=eq.${input.userId}&session_id=eq.${input.sessionId}&status=in.(sent,opened)`,
  );

  const now = new Date().toISOString();
  let answeredQuestionCount = 0;

  const openedQuestionEvents = (
    questionEvents as UserQuestionEventRow[]
  ).filter((event) => event.status === "opened");
  const sentQuestionEvents = (questionEvents as UserQuestionEventRow[]).filter(
    (event) => event.status === "sent",
  );
  const questionIds = [
    ...new Set(questionEvents.map((event) => event.question_id)),
  ];
  const questionsById = await loadPromptQuestionsById(questionIds);
  const questionEventsToAnswer =
    openedQuestionEvents.length > 0
      ? openedQuestionEvents
      : (() => {
          const match = resolveBestQuestionEventMatch({
            events: sentQuestionEvents,
            questionsById,
            userMessageText: input.userMessageText,
          });
          return match?.mode === "answered" ? [match.event] : [];
        })();
  const questionEventsToOpen =
    openedQuestionEvents.length === 0
      ? (() => {
          const match = resolveBestQuestionEventMatch({
            events: sentQuestionEvents,
            questionsById,
            userMessageText: input.userMessageText,
          });
          return match?.mode === "opened" ? [match.event] : [];
        })()
      : [];

  for (const event of questionEventsToOpen) {
    await dbUpdate(`user_question_events?id=eq.${event.id}`, {
      status: "opened",
      answer_text: input.userMessageText,
      updated_at: now,
    });
  }

  for (const event of questionEventsToAnswer) {
    await dbUpdate(`user_question_events?id=eq.${event.id}`, {
      status: "answered",
      answer_message_id: input.userMessageId,
      answer_text: input.userMessageText,
      answered_at: now,
      updated_at: now,
    });
    await syncAnsweredQuestionToCalendar({
      userId: input.userId,
      sessionId: input.sessionId,
      questionEventId: event.id,
      questionId: event.question_id,
      userMessageId: input.userMessageId,
      userMessageText: input.userMessageText,
      answeredAt: now,
    });
    answeredQuestionCount += 1;
  }

  return {
    answeredCount: answeredQuestionCount + questionEventsToOpen.length,
  };
}

export async function createPromptEvents(input: {
  userId: string;
  sessionId: string;
  assistantMessageId: string | null;
  checklists: ChecklistRow[];
  questions: QuestionRow[];
}) {
  const now = new Date().toISOString();

  for (const question of input.questions) {
    await dbInsert("user_question_events", {
      user_id: input.userId,
      question_id: question.id,
      session_id: input.sessionId,
      prompt_message_id: input.assistantMessageId,
      status: "sent",
      sent_at: now,
      updated_at: now,
    });
  }
}

export async function getAlreadyPromptedIds(input: {
  userId: string;
}): Promise<{ checklistIds: Set<string>; questionIds: Set<string> }> {
  const questionEvents = await dbSelect<UserQuestionEventRow[]>(
    `user_question_events?select=id,question_id,status&user_id=eq.${input.userId}`,
  );

  return {
    checklistIds: new Set(),
    questionIds: new Set(questionEvents.map((e) => e.question_id)),
  };
}

export function isKstDateToday(
  iso: string | null | undefined,
  now = new Date(),
) {
  if (!iso) {
    return true;
  }
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) {
    return true;
  }

  return getKstDateKey(target) === getKstDateKey(now);
}

export class PastSessionWriteError extends Error {
  constructor() {
    super("past chat session is read-only");
    this.name = "PastSessionWriteError";
  }
}

export async function ensureChatSession(input: {
  userId: string;
  sessionId: string;
  title: string;
}) {
  const existingSession = (
    await dbSelect<
      Array<{
        id: string;
        title: string | null;
        last_message_at: string | null;
      }>
    >(
      `chat_sessions?select=id,title,last_message_at&id=eq.${input.sessionId}&user_id=eq.${input.userId}&limit=1`,
    )
  )[0];

  if (existingSession) {
    if (!isKstDateToday(existingSession.last_message_at)) {
      throw new PastSessionWriteError();
    }
  } else {
    await dbInsert("chat_sessions", {
      id: input.sessionId,
      user_id: input.userId,
      title: input.title,
      status: "active",
    });
  }

  return { sessionId: input.sessionId };
}

export async function saveUserChatMessage(input: {
  sessionId: string;
  userId: string;
  text: string;
  imageDataUris: string[];
}) {
  const userMessageParts = [
    ...(input.text
      ? [
          {
            type: "text" as const,
            id: `user-text-${Date.now()}`,
            text: input.text,
          },
        ]
      : []),
    ...input.imageDataUris.map((uri: string, index: number) => ({
      type: "image" as const,
      id: `user-image-${Date.now()}-${index}`,
      imageUrl: uri,
      alt: "사용자 첨부 이미지",
      caption: "사용자 첨부 이미지",
    })),
  ];

  const insertedRows = await dbInsert<Array<{ id: string }>>("chat_messages", {
    session_id: input.sessionId,
    user_id: input.userId,
    role: "user",
    parts: userMessageParts,
    plain_text: input.text,
    image_attachments: input.imageDataUris.map((uri: string) => ({ uri })),
  });
  const insertedUserMessage = insertedRows[0];

  return {
    id: insertedUserMessage?.id,
    parts: userMessageParts,
  };
}

export async function touchChatSessionActivity(
  sessionId: string,
  timestamp: string,
) {
  await dbUpdate(`chat_sessions?id=eq.${sessionId}`, {
    last_message_at: timestamp,
    updated_at: timestamp,
  });
}

export async function saveAssistantChatMessages(input: {
  sessionId: string;
  userId: string;
  messages: Array<{
    parts: Array<
      { type: string; text?: string } | { type: string; [key: string]: unknown }
    >;
  }>;
}) {
  return dbInsert<Array<{ id: string }>>(
    "chat_messages",
    input.messages.map((message) => ({
      session_id: input.sessionId,
      user_id: input.userId,
      role: "assistant",
      parts: message.parts,
      plain_text: message.parts
        .flatMap((part) =>
          part.type === "text" && typeof part.text === "string"
            ? [part.text]
            : [],
        )
        .join("\n"),
      model_name: "gemini-2.5-flash-lite",
    })),
  );
}

export async function updateSessionMemory(
  sessionId: string,
  nextSessionMemory: SessionMemoryPayload | null | undefined,
  timestamp: string,
) {
  await dbUpdate(`chat_sessions?id=eq.${sessionId}`, {
    last_message_at: timestamp,
    updated_at: timestamp,
    ...(nextSessionMemory
      ? {
          memory_payload: {
            ...nextSessionMemory,
            updatedAt: timestamp,
          },
        }
      : {}),
  });
}

export async function updateProfileMemory(input: {
  userId: string;
  onboardingPayload: PregnancyProfilePromptRow["onboarding_payload"];
  currentProfileMemory: ProfileMemoryPayload | null;
  nextProfileMemory: ProfileMemoryPayload | null | undefined;
  timestamp: string;
}) {
  if (!input.nextProfileMemory) {
    return;
  }

  const {
    personaHint: _personaHint,
    personaConfidence: _personaConfidence,
    personaEvidence: _personaEvidence,
    ...profileMemory
  } = input.nextProfileMemory;
  const hasProfileMemoryUpdate = Object.values(profileMemory).some(
    (value) => value !== undefined,
  );

  if (hasProfileMemoryUpdate) {
    await dbUpdate(`pregnancy_profiles?user_id=eq.${input.userId}`, {
      onboarding_payload: {
        ...(input.onboardingPayload ?? {}),
        profileMemory: {
          ...(input.currentProfileMemory ?? {}),
          ...profileMemory,
          updatedAt: input.timestamp,
        },
      },
    });
  }
}
