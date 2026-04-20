import type {
  PersonaConfidence,
  PersonaHint,
  ProfileMemoryPayload,
  SessionMemoryPayload,
} from "./workflow-payload";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "../supabase/admin-client";

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
  const existingRows = await supabaseSelect<CalendarQuestionResponseRow[]>(
    `calendar_logs?select=id,payload&user_id=eq.${input.userId}&date=eq.${todayDate}&entry_type=eq.survey_response`,
  );
  const existingRow = existingRows.find(
    (row) => row.payload?.questionId === input.questionId,
  );
  const payload = {
    source: "chat_question_answer",
    questionId: input.questionId,
    answer: answerText,
    answerMessageId: input.userMessageId,
    eventId: input.questionEventId,
    answeredAt: input.answeredAt,
  };

  if (existingRow) {
    await supabaseUpdate(`calendar_logs?id=eq.${existingRow.id}`, {
      session_id: input.sessionId,
      title: "하루 질문 답변",
      summary,
      payload,
    });
    return;
  }

  await supabaseInsert("calendar_logs", {
    user_id: input.userId,
    session_id: input.sessionId,
    date: todayDate,
    entry_type: "survey_response",
    title: "하루 질문 답변",
    summary,
    payload,
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
  const [profiles, sessions, personaProfiles] = await Promise.all([
    supabaseSelect<PregnancyProfilePromptRow[]>(
      `pregnancy_profiles?select=pregnancy_day_count,pregnancy_week,pregnancy_day_in_week,baby_nickname,display_name,due_date,onboarding_payload&user_id=eq.${userId}&limit=1`,
    ),
    sessionId
      ? supabaseSelect<
          Array<{
            id: string;
            title: string;
            memory_payload?: SessionMemoryPayload | null;
          }>
        >(
          `chat_sessions?select=id,title,memory_payload&id=eq.${sessionId}&user_id=eq.${userId}&limit=1`,
        )
      : Promise.resolve([]),
    supabaseSelect<UserPersonaProfileRow[]>(
      `v_user_persona_profiles?select=user_id,persona_hint,confidence,evidence_summary,weighted_score,last_observed_at&user_id=eq.${userId}&limit=1`,
    ),
  ]);

  const profile = profiles[0];
  const todayIsoDate = getKstDateKey();
  const position = profile
    ? resolveSelectedPregnancyPosition(profile, todayIsoDate)
    : null;
  const pregnancyWeek = position?.weekNumber ?? hintedPregnancyWeek ?? null;
  const dayNumber = position?.dayNumber ?? null;
  if (!pregnancyWeek || !dayNumber) {
    return null;
  }

  const weekRows = await supabaseSelect<WeekDataRow[]>(
    `content_pregnancy_week_data?select=id,week_number,title,baby_summary,mother_summary,warning_signs,recommended_actions,checklist_intro,question_intro,status&week_number=eq.${pregnancyWeek}&status=eq.published&limit=1`,
  );
  const week = weekRows[0];
  if (!week) {
    return null;
  }

  const [
    dayContentRows,
    datedChecklists,
    genericChecklists,
    datedQuestions,
    genericQuestions,
  ] = await Promise.all([
    supabaseSelect<DayContentRow[]>(
      `content_pregnancy_day_contents?select=id,day_number,title,baby_development_payload,baby_message,mother_changes_payload&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&limit=1`,
    ),
    supabaseSelect<ChecklistRow[]>(
      `content_week_checklists?select=id,code,title,description,checklist_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc`,
    ),
    supabaseSelect<ChecklistRow[]>(
      `content_week_checklists?select=id,code,title,description,checklist_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc`,
    ),
    supabaseSelect<QuestionRow[]>(
      `content_week_questions?select=id,code,question_text,question_type,help_text,question_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc&limit=1`,
    ),
    supabaseSelect<QuestionRow[]>(
      `content_week_questions?select=id,code,question_text,question_type,help_text,question_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=is.null&is_active=eq.true&order=display_order.asc&limit=1`,
    ),
  ]);

  const checklists = [...datedChecklists, ...genericChecklists];
  const questions = datedQuestions[0]
    ? [datedQuestions[0]]
    : genericQuestions[0]
      ? [genericQuestions[0]]
      : [];

  const personaProfile = personaProfiles[0] ?? null;
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
    dayContent: dayContentRows[0] ?? null,
    checklists,
    questions,
    tonePreference: profile?.onboarding_payload?.tonePreference ?? null,
    profileMemory: Object.keys(profileMemory).length > 0 ? profileMemory : null,
    sessionMemory: sessions[0]?.memory_payload ?? null,
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
    supabaseSelect<UserChecklistEventRow[]>(
      `user_checklist_events?select=id,checklist_id,status&user_id=eq.${input.userId}&session_id=eq.${input.sessionId}&status=eq.sent`,
    ),
    supabaseSelect<UserQuestionEventRow[]>(
      `user_question_events?select=id,question_id,status&user_id=eq.${input.userId}&session_id=eq.${input.sessionId}&status=eq.sent`,
    ),
  ]);

  const now = new Date().toISOString();

  for (const event of checklistEvents) {
    await supabaseUpdate(`user_checklist_events?id=eq.${event.id}`, {
      status: "completed",
      completion_message_id: input.userMessageId,
      answer_text: input.userMessageText,
      completed_at: now,
      updated_at: now,
    });
  }

  for (const event of questionEvents) {
    await supabaseUpdate(`user_question_events?id=eq.${event.id}`, {
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
    await supabaseInsert("user_checklist_events", {
      user_id: input.userId,
      checklist_id: checklist.id,
      session_id: input.sessionId,
      prompt_message_id: input.assistantMessageId,
      status: "sent",
      sent_at: now,
      updated_at: now,
    });
  }

  for (const question of input.questions) {
    await supabaseInsert("user_question_events", {
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
  const [checklistEvents, questionEvents] = await Promise.all([
    supabaseSelect<UserChecklistEventRow[]>(
      `user_checklist_events?select=id,checklist_id,status&user_id=eq.${input.userId}`,
    ),
    supabaseSelect<UserQuestionEventRow[]>(
      `user_question_events?select=id,question_id,status&user_id=eq.${input.userId}`,
    ),
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
  const existingSessions = await supabaseSelect<
    Array<{ id: string; title: string; last_message_at: string | null }>
  >(
    `chat_sessions?select=id,title,last_message_at&id=eq.${input.sessionId}&user_id=eq.${input.userId}&limit=1`,
  );

  const existingSession = existingSessions[0];

  if (existingSession) {
    if (!isLocalDateToday(existingSession.last_message_at)) {
      throw new PastSessionWriteError();
    }
  } else {
    await supabaseInsert("chat_sessions", {
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

  const insertedUserMessages = await supabaseInsert<Array<{ id: string }>>(
    "chat_messages",
    {
      session_id: input.sessionId,
      user_id: input.userId,
      role: "user",
      parts: userMessageParts,
      plain_text: input.text,
      image_attachments: input.imageDataUris.map((uri: string) => ({ uri })),
    },
  );

  return {
    id: insertedUserMessages[0]?.id ?? null,
    parts: userMessageParts,
  };
}

export async function touchChatSessionActivity(
  sessionId: string,
  timestamp: string,
) {
  await supabaseUpdate(`chat_sessions?id=eq.${sessionId}`, {
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
  return supabaseInsert<Array<{ id: string }>>(
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
  await supabaseUpdate(`chat_sessions?id=eq.${sessionId}`, {
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
    await supabaseUpdate(`pregnancy_profiles?user_id=eq.${input.userId}`, {
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
