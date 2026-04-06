import type { ProfileMemoryPayload, SessionMemoryPayload } from "@/lib/mobile/chat/workflow-payload";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";

type PregnancyProfilePromptRow = {
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
  question_type: "text" | "single_choice" | "multi_choice" | "yes_no" | "number";
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

export async function getPromptContext(
  userId: string,
  hintedPregnancyWeek: number | null,
  sessionId: string | null,
): Promise<PromptContext | null> {
  const [profiles, sessions] = await Promise.all([
    supabaseSelect<PregnancyProfilePromptRow[]>(
      `pregnancy_profiles?select=pregnancy_week,pregnancy_day_in_week,baby_nickname,display_name,due_date,onboarding_payload&user_id=eq.${userId}&limit=1`,
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
  ]);

  const pregnancyWeek = hintedPregnancyWeek ?? profiles[0]?.pregnancy_week ?? null;
  if (!pregnancyWeek) {
    return null;
  }

  const dayNumber = ((profiles[0]?.pregnancy_day_in_week ?? 0) % 7) + 1;

  const weekRows = await supabaseSelect<WeekDataRow[]>(
    `content_pregnancy_week_data?select=id,week_number,title,baby_summary,mother_summary,warning_signs,recommended_actions,checklist_intro,question_intro,status&week_number=eq.${pregnancyWeek}&status=eq.published&limit=1`,
  );
  const week = weekRows[0];
  if (!week) {
    return null;
  }

  const [dayContentRows, checklists, questions] = await Promise.all([
    supabaseSelect<DayContentRow[]>(
      `content_pregnancy_day_contents?select=id,day_number,title,baby_development_payload,baby_message,mother_changes_payload&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&limit=1`,
    ),
    supabaseSelect<ChecklistRow[]>(
      `content_week_checklists?select=id,code,title,description,checklist_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc`,
    ),
    supabaseSelect<QuestionRow[]>(
      `content_week_questions?select=id,code,question_text,question_type,help_text,question_payload,display_order,is_required&week_data_id=eq.${week.id}&day_number=eq.${dayNumber}&is_active=eq.true&order=display_order.asc`,
    ),
  ]);

  const profile = profiles[0];
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
    profileMemory: profile?.onboarding_payload?.profileMemory ?? null,
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
}) {
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
  }
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
  sessionId: string;
}): Promise<{ checklistIds: Set<string>; questionIds: Set<string> }> {
  const [checklistEvents, questionEvents] = await Promise.all([
    supabaseSelect<UserChecklistEventRow[]>(
      `user_checklist_events?select=id,checklist_id,status&user_id=eq.${input.userId}&session_id=eq.${input.sessionId}`,
    ),
    supabaseSelect<UserQuestionEventRow[]>(
      `user_question_events?select=id,question_id,status&user_id=eq.${input.userId}&session_id=eq.${input.sessionId}`,
    ),
  ]);

  return {
    checklistIds: new Set(checklistEvents.map((e) => e.checklist_id)),
    questionIds: new Set(questionEvents.map((e) => e.question_id)),
  };
}

export async function ensureChatSession(input: {
  userId: string;
  sessionId: string;
  title: string;
}) {
  const existingSessions = await supabaseSelect<Array<{ id: string; title: string }>>(
    `chat_sessions?select=id,title&id=eq.${input.sessionId}&user_id=eq.${input.userId}&limit=1`,
  );

  if (!existingSessions[0]) {
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

export async function touchChatSessionActivity(sessionId: string, timestamp: string) {
  await supabaseUpdate(`chat_sessions?id=eq.${sessionId}`, {
    last_message_at: timestamp,
    updated_at: timestamp,
  });
}

export async function saveAssistantChatMessages(input: {
  sessionId: string;
  userId: string;
  messages: Array<{
    parts: Array<{ type: string; text?: string }>;
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
        .filter(
          (part): part is Extract<typeof part, { type: "text"; text: string }> =>
            part.type === "text" && typeof part.text === "string",
        )
        .map((part) => part.text)
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

  await supabaseUpdate(`pregnancy_profiles?user_id=eq.${input.userId}`, {
    onboarding_payload: {
      ...(input.onboardingPayload ?? {}),
      profileMemory: {
        ...(input.currentProfileMemory ?? {}),
        ...input.nextProfileMemory,
        updatedAt: input.timestamp,
      },
    },
  });
}
