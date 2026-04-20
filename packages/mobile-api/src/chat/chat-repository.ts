import { prisma } from "@gynecology-chatbot/db/prisma";
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

const MAX_PREGNANCY_DAYS = 294;
const MIN_PREGNANCY_WEEK = 1;
const MAX_PREGNANCY_WEEK = 42;

function getKstDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function formatDateOnly(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function toIsoStringOrNull(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function asObject<T>(value: unknown): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}

function mapPregnancyProfileRow(
  row:
    | {
        pregnancy_day_count: number;
        pregnancy_week: number | null;
        pregnancy_day_in_week: number | null;
        baby_nickname: string | null;
        display_name: string | null;
        due_date: Date | null;
        onboarding_payload: unknown;
      }
    | null,
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
    onboarding_payload: asObject<PregnancyProfilePromptRow["onboarding_payload"]>(
      row.onboarding_payload,
    ),
  };
}

function mapWeekDataRow(
  row:
    | {
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
      }
    | null,
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
  row:
    | {
        id: string;
        day_number: number;
        title: string | null;
        baby_development_payload: unknown;
        baby_message: string | null;
        mother_changes_payload: unknown;
      }
    | null,
): DayContentRow | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    day_number: row.day_number,
    title: row.title,
    baby_development_payload: asObject<DayContentRow["baby_development_payload"]>(
      row.baby_development_payload,
    ),
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
  row:
    | {
        user_id: string | null;
        persona_hint: string | null;
        confidence: string | null;
        evidence_summary: string | null;
        weighted_score: { toNumber(): number } | number | null;
        last_observed_at: Date | null;
      }
    | null,
): UserPersonaProfileRow | null {
  if (!row?.user_id || !row.persona_hint || !row.confidence) {
    return null;
  }

  return {
    user_id: row.user_id,
    persona_hint: row.persona_hint as PersonaHint,
    confidence: row.confidence as PersonaConfidence,
    evidence_summary: row.evidence_summary,
    weighted_score:
      typeof row.weighted_score === "number"
        ? row.weighted_score
        : row.weighted_score?.toNumber() ?? 0,
    last_observed_at: toIsoStringOrNull(row.last_observed_at),
  };
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
  const existingRows = await prisma.calendar_logs.findMany({
    where: {
      user_id: input.userId,
      date: parseDateOnly(todayDate),
      entry_type: "survey_response",
    },
    select: {
      id: true,
      payload: true,
    },
  });
  const existingRow = existingRows
    .map(
      (row): CalendarQuestionResponseRow => ({
        id: row.id,
        payload: asObject<CalendarQuestionResponseRow["payload"]>(row.payload),
      }),
    )
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
    await prisma.calendar_logs.update({
      where: { id: existingRow.id },
      data: {
        session_id: input.sessionId,
        title: "하루 질문 답변",
        summary,
        payload,
      },
    });
    return;
  }

  await prisma.calendar_logs.create({
    data: {
      user_id: input.userId,
      session_id: input.sessionId,
      date: parseDateOnly(todayDate),
      entry_type: "survey_response",
      title: "하루 질문 답변",
      summary,
      payload,
    },
  });
}

function diffCalendarDays(targetIsoDate: string, baseIsoDate: string) {
  const [targetYear, targetMonth, targetDay] = targetIsoDate
    .split("-")
    .map(Number);
  const [baseYear, baseMonth, baseDay] = baseIsoDate.split("-").map(Number);
  const target = Date.UTC(targetYear, targetMonth - 1, targetDay);
  const base = Date.UTC(baseYear, baseMonth - 1, baseDay);
  return Math.round((target - base) / 86_400_000);
}

function calculatePregnancyPositionFromDueDate(
  dueDate: string,
  targetIsoDate: string,
) {
  const diffDays = diffCalendarDays(dueDate, targetIsoDate);
  if (diffDays < 0) {
    return { weekNumber: 40, dayNumber: 1 };
  }

  const pregnancyDayCount = Math.max(
    0,
    Math.min(MAX_PREGNANCY_DAYS, MAX_PREGNANCY_DAYS - diffDays),
  );
  const weekNumber = Math.max(
    MIN_PREGNANCY_WEEK,
    Math.min(MAX_PREGNANCY_WEEK, Math.floor(pregnancyDayCount / 7)),
  );
  const dayNumber = (pregnancyDayCount % 7) + 1;

  return { weekNumber, dayNumber };
}

function resolveCurrentPregnancyDayCount(profile: PregnancyProfilePromptRow) {
  if (
    typeof profile.pregnancy_day_count === "number" &&
    profile.pregnancy_day_count > 0
  ) {
    return profile.pregnancy_day_count;
  }

  if (
    typeof profile.pregnancy_week === "number" &&
    typeof profile.pregnancy_day_in_week === "number"
  ) {
    return (profile.pregnancy_week - 1) * 7 + profile.pregnancy_day_in_week;
  }

  return null;
}

function resolveSelectedPregnancyPosition(
  profile: PregnancyProfilePromptRow,
  isoDate: string,
) {
  if (profile.due_date) {
    return calculatePregnancyPositionFromDueDate(profile.due_date, isoDate);
  }

  const currentPregnancyDayCount = resolveCurrentPregnancyDayCount(profile);
  if (!currentPregnancyDayCount) {
    return null;
  }

  const dayOffset = diffCalendarDays(isoDate, getKstDateKey());
  const selectedPregnancyDayCount = currentPregnancyDayCount + dayOffset;
  if (selectedPregnancyDayCount <= 0) {
    return null;
  }

  return {
    weekNumber: Math.ceil(selectedPregnancyDayCount / 7),
    dayNumber: ((selectedPregnancyDayCount - 1) % 7) + 1,
  };
}

export async function getPromptContext(
  userId: string,
  hintedPregnancyWeek: number | null,
  sessionId: string | null,
): Promise<PromptContext | null> {
  const [profileRow, sessionRow, personaProfileRow] = await Promise.all([
    prisma.pregnancy_profiles.findUnique({
      where: { user_id: userId },
      select: {
        pregnancy_day_count: true,
        pregnancy_week: true,
        pregnancy_day_in_week: true,
        baby_nickname: true,
        display_name: true,
        due_date: true,
        onboarding_payload: true,
      },
    }),
    sessionId
      ? prisma.chat_sessions.findFirst({
          where: {
            id: sessionId,
            user_id: userId,
          },
          select: {
            id: true,
            title: true,
            memory_payload: true,
          },
        })
      : Promise.resolve(null),
    prisma.v_user_persona_profiles.findFirst({
      where: { user_id: userId },
      select: {
        user_id: true,
        persona_hint: true,
        confidence: true,
        evidence_summary: true,
        weighted_score: true,
        last_observed_at: true,
      },
    }),
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
    await prisma.content_pregnancy_week_data.findFirst({
      where: {
        week_number: pregnancyWeek,
        status: "published",
      },
      select: {
        id: true,
        week_number: true,
        title: true,
        baby_summary: true,
        mother_summary: true,
        warning_signs: true,
        recommended_actions: true,
        checklist_intro: true,
        question_intro: true,
        status: true,
      },
    }),
  );
  if (!week) {
    return null;
  }

  const [
    dayContentRow,
    datedChecklistRows,
    genericChecklistRows,
    datedQuestionRow,
    genericQuestionRow,
  ] = await Promise.all([
    prisma.content_pregnancy_day_contents.findFirst({
      where: {
        week_data_id: week.id,
        day_number: dayNumber,
      },
      select: {
        id: true,
        day_number: true,
        title: true,
        baby_development_payload: true,
        baby_message: true,
        mother_changes_payload: true,
      },
    }),
    prisma.content_week_checklists.findMany({
      where: {
        week_data_id: week.id,
        day_number: dayNumber,
        is_active: true,
      },
      orderBy: {
        display_order: "asc",
      },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        checklist_payload: true,
        display_order: true,
        is_required: true,
      },
    }),
    prisma.content_week_checklists.findMany({
      where: {
        week_data_id: week.id,
        day_number: null,
        is_active: true,
      },
      orderBy: {
        display_order: "asc",
      },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        checklist_payload: true,
        display_order: true,
        is_required: true,
      },
    }),
    prisma.content_week_questions.findFirst({
      where: {
        week_data_id: week.id,
        day_number: dayNumber,
        is_active: true,
      },
      orderBy: {
        display_order: "asc",
      },
      select: {
        id: true,
        code: true,
        question_text: true,
        question_type: true,
        help_text: true,
        question_payload: true,
        display_order: true,
        is_required: true,
      },
    }),
    prisma.content_week_questions.findFirst({
      where: {
        week_data_id: week.id,
        day_number: null,
        is_active: true,
      },
      orderBy: {
        display_order: "asc",
      },
      select: {
        id: true,
        code: true,
        question_text: true,
        question_type: true,
        help_text: true,
        question_payload: true,
        display_order: true,
        is_required: true,
      },
    }),
  ]);

  const checklists = [...datedChecklistRows, ...genericChecklistRows].map(
    mapChecklistRow,
  );
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
    checklists,
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
  const [checklistEvents, questionEvents] = await Promise.all([
    prisma.user_checklist_events.findMany({
      where: {
        user_id: input.userId,
        session_id: input.sessionId,
        status: "sent",
      },
      select: {
        id: true,
        checklist_id: true,
        status: true,
      },
    }),
    prisma.user_question_events.findMany({
      where: {
        user_id: input.userId,
        session_id: input.sessionId,
        status: "sent",
      },
      select: {
        id: true,
        question_id: true,
        status: true,
      },
    }),
  ]);

  const now = new Date().toISOString();

  for (const event of checklistEvents as UserChecklistEventRow[]) {
    await prisma.user_checklist_events.update({
      where: { id: event.id },
      data: {
        status: "completed",
        completion_message_id: input.userMessageId,
        answer_text: input.userMessageText,
        completed_at: now,
        updated_at: now,
      },
    });
  }

  for (const event of questionEvents as UserQuestionEventRow[]) {
    await prisma.user_question_events.update({
      where: { id: event.id },
      data: {
        status: "answered",
        answer_message_id: input.userMessageId,
        answer_text: input.userMessageText,
        answered_at: now,
        updated_at: now,
      },
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
  }

  return { answeredCount: checklistEvents.length + questionEvents.length };
}

export async function createPromptEvents(input: {
  userId: string;
  sessionId: string;
  assistantMessageId: string | null;
  checklists: ChecklistRow[];
  questions: QuestionRow[];
}) {
  const now = new Date().toISOString();

  for (const checklist of input.checklists) {
    await prisma.user_checklist_events.create({
      data: {
        user_id: input.userId,
        checklist_id: checklist.id,
        session_id: input.sessionId,
        prompt_message_id: input.assistantMessageId,
        status: "sent",
        sent_at: now,
        updated_at: now,
      },
    });
  }

  for (const question of input.questions) {
    await prisma.user_question_events.create({
      data: {
        user_id: input.userId,
        question_id: question.id,
        session_id: input.sessionId,
        prompt_message_id: input.assistantMessageId,
        status: "sent",
        sent_at: now,
        updated_at: now,
      },
    });
  }
}

export async function getAlreadyPromptedIds(input: {
  userId: string;
}): Promise<{ checklistIds: Set<string>; questionIds: Set<string> }> {
  const [checklistEvents, questionEvents] = await Promise.all([
    prisma.user_checklist_events.findMany({
      where: { user_id: input.userId },
      select: {
        id: true,
        checklist_id: true,
        status: true,
      },
    }),
    prisma.user_question_events.findMany({
      where: { user_id: input.userId },
      select: {
        id: true,
        question_id: true,
        status: true,
      },
    }),
  ]);

  return {
    checklistIds: new Set(checklistEvents.map((e) => e.checklist_id)),
    questionIds: new Set(questionEvents.map((e) => e.question_id)),
  };
}

function isLocalDateToday(iso: string | null | undefined) {
  if (!iso) {
    return true;
  }
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) {
    return true;
  }
  const now = new Date();
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
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
  const existingSession = await prisma.chat_sessions.findFirst({
    where: {
      id: input.sessionId,
      user_id: input.userId,
    },
    select: {
      id: true,
      title: true,
      last_message_at: true,
    },
  });

  if (existingSession) {
    if (!isLocalDateToday(toIsoStringOrNull(existingSession.last_message_at))) {
      throw new PastSessionWriteError();
    }
  } else {
    await prisma.chat_sessions.create({
      data: {
        id: input.sessionId,
        user_id: input.userId,
        title: input.title,
        status: "active",
      },
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

  const insertedUserMessage = await prisma.chat_messages.create({
    data: {
      session_id: input.sessionId,
      user_id: input.userId,
      role: "user",
      parts: userMessageParts,
      plain_text: input.text,
      image_attachments: input.imageDataUris.map((uri: string) => ({ uri })),
    },
    select: { id: true },
  });

  return {
    id: insertedUserMessage.id,
    parts: userMessageParts,
  };
}

export async function touchChatSessionActivity(
  sessionId: string,
  timestamp: string,
) {
  await prisma.chat_sessions.updateMany({
    where: { id: sessionId },
    data: {
      last_message_at: timestamp,
      updated_at: timestamp,
    },
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
  return prisma.$transaction(
    input.messages.map((message) =>
      prisma.chat_messages.create({
        data: {
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
        },
        select: { id: true },
      }),
    ),
  );
}

export async function updateSessionMemory(
  sessionId: string,
  nextSessionMemory: SessionMemoryPayload | null | undefined,
  timestamp: string,
) {
  await prisma.chat_sessions.updateMany({
    where: { id: sessionId },
    data: {
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
    },
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
    await prisma.pregnancy_profiles.updateMany({
      where: { user_id: input.userId },
      data: {
        onboarding_payload: {
          ...(input.onboardingPayload ?? {}),
          profileMemory: {
            ...(input.currentProfileMemory ?? {}),
            ...profileMemory,
            updatedAt: input.timestamp,
          },
        },
      },
    });
  }
}
