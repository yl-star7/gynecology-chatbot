import { Hono } from "hono";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

const app = new Hono();

type ChecklistEvent = {
  user_id: string;
  answer_text: string | null;
  status: string;
  completed_at: string | null;
  week_checklists: { title: string } | null;
};

type QuestionEvent = {
  user_id: string;
  answer_text: string | null;
  status: string;
  answered_at: string | null;
  week_questions: { question_text: string } | null;
};

type ChatSnippet = {
  user_id: string;
  session_title: string;
  user_messages: string;
  message_count: number;
};

type UserDayData = {
  userId: string;
  checklists: Array<{
    title: string;
    answer: string | null;
    completed: boolean;
  }>;
  questions: Array<{
    question: string;
    answer: string | null;
    answered: boolean;
  }>;
  chatSnippets: string;
  sessionCount: number;
};

function isAuthorized(authHeader: string | undefined) {
  return Boolean(
    process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`,
  );
}

function getKstYesterday(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setDate(kst.getDate() - 1);
  return kst.toISOString().slice(0, 10);
}

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function asObject<T>(value: Prisma.JsonValue | null | undefined): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}

async function fetchUserDayData(targetDate: string): Promise<UserDayData[]> {
  const dayDate = parseDateOnly(targetDate);

  const [rawChecklists, rawQuestions, rawChats] = await Promise.all([
    prisma.user_checklist_events.findMany({
      where: {
        updated_at: {
          gte: dayDate,
          lt: new Date(dayDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      select: {
        user_id: true,
        answer_text: true,
        status: true,
        completed_at: true,
        content_week_checklists: {
          select: { title: true },
        },
      },
    }),
    prisma.user_question_events.findMany({
      where: {
        updated_at: {
          gte: dayDate,
          lt: new Date(dayDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      select: {
        user_id: true,
        answer_text: true,
        status: true,
        answered_at: true,
        content_week_questions: {
          select: { question_text: true },
        },
      },
    }),
    prisma.calendar_logs.findMany({
      where: {
        date: dayDate,
        entry_type: "chat_saved",
      },
      select: {
        user_id: true,
        title: true,
        payload: true,
      },
    }),
  ]);

  const userMap = new Map<string, UserDayData>();

  function ensureUser(userId: string): UserDayData {
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId,
        checklists: [],
        questions: [],
        chatSnippets: "",
        sessionCount: 0,
      });
    }
    return userMap.get(userId)!;
  }

  for (const row of rawChecklists) {
    const user = ensureUser(row.user_id);
    user.checklists.push({
      title: row.content_week_checklists?.title ?? "체크리스트",
      answer: row.answer_text,
      completed: row.status === "completed",
    });
  }

  for (const row of rawQuestions) {
    const user = ensureUser(row.user_id);
    user.questions.push({
      question: row.content_week_questions?.question_text ?? "질문",
      answer: row.answer_text,
      answered: row.status === "answered",
    });
  }

  for (const row of rawChats) {
    const user = ensureUser(row.user_id);
    const payload = asObject<{
      assistantSummary?: string | null;
      compactSummary?: string | null;
    }>(row.payload);
    const snippet =
      payload?.compactSummary ?? payload?.assistantSummary ?? row.title;
    user.chatSnippets = [user.chatSnippets, snippet].filter(Boolean).join("\n");
    user.sessionCount += 1;
  }

  return Array.from(userMap.values());
}

async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
      }),
    },
  );
  if (!response.ok) {
    console.error("Gemini error:", response.status, await response.text());
    return null;
  }
  const result = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

function buildDaySummaryPrompt(data: UserDayData): string {
  const parts: string[] = [];
  if (data.checklists.length > 0) {
    parts.push(
      "[체크리스트]\n" +
        data.checklists
          .map(
            (c) =>
              `- ${c.title}: ${c.completed ? (c.answer ?? "완료") : "미완료"}`,
          )
          .join("\n"),
    );
  }
  if (data.questions.length > 0) {
    parts.push(
      "[질문 응답]\n" +
        data.questions
          .map(
            (q) =>
              `- ${q.question}: ${q.answered ? (q.answer ?? "응답함") : "미응답"}`,
          )
          .join("\n"),
    );
  }
  if (data.chatSnippets) {
    parts.push(`[대화 내용]\n${data.chatSnippets}`);
  }
  if (parts.length === 0) return "";
  return [
    "아래는 임산부 사용자의 하루 활동 기록이에요.",
    "따뜻한 톤(-어요/-해요 체)으로 2~3문장으로 자연스럽게 요약해 주세요.",
    "체크리스트 완료 여부, 질문 응답, 주요 대화 주제를 포함해 주세요.",
    "",
    parts.join("\n\n"),
  ].join("\n");
}

function buildFallbackDaySummary(data: UserDayData): string {
  const parts: string[] = [];
  const done = data.checklists.filter((c) => c.completed).length;
  if (done > 0) parts.push(`체크리스트 ${done}개를 완료했어요`);
  const answered = data.questions.filter((q) => q.answered).length;
  if (answered > 0) parts.push(`질문 ${answered}개에 응답했어요`);
  if (data.sessionCount > 0)
    parts.push(`${data.sessionCount}개의 대화를 나눴어요`);
  return parts.length > 0
    ? `이날에는 ${parts.join(", ")}.`
    : "이날에는 활동 기록이 없어요.";
}

app.post("/", async (c) => {
  try {
    if (!isAuthorized(c.req.header("authorization"))) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const targetDate =
      (body as { targetDate?: string }).targetDate || getKstYesterday();

    const users = await fetchUserDayData(targetDate);

    let aiSummaryCount = 0;
    let questionSummaryCount = 0;
    let skippedAiSummary = 0;
    let skippedQuestionSummary = 0;

    const [existingAiRows, existingQuestionRows] = await Promise.all([
      prisma.calendar_logs.findMany({
        where: {
          date: parseDateOnly(targetDate),
          entry_type: "ai_summary",
        },
        select: { user_id: true, payload: true },
      }),
      prisma.calendar_logs.findMany({
        where: {
          date: parseDateOnly(targetDate),
          entry_type: "question_summary",
        },
        select: { user_id: true, payload: true },
      }),
    ]);

    const existingAiUserIds = new Set(
      existingAiRows
        .filter(
          (row) =>
            asObject<{ source?: string }>(row.payload)?.source ===
            "daily_conversation_summary",
        )
        .map((row) => row.user_id),
    );
    const existingQuestionKeys = new Set(
      existingQuestionRows
        .filter(
          (row) =>
            asObject<{ source?: string }>(row.payload)?.source ===
            "daily_question_summary",
        )
        .map((row) => {
          const payload = asObject<{ question?: string }>(row.payload);
          return `${row.user_id}:${payload?.question ?? ""}`;
        }),
    );

    const errors: string[] = [];

    for (const userData of users) {
      const hasActivity =
        userData.checklists.length > 0 ||
        userData.questions.length > 0 ||
        (userData.chatSnippets && userData.chatSnippets.trim().length > 0);

      if (!hasActivity) {
        continue;
      }

      if (existingAiUserIds.has(userData.userId)) {
        skippedAiSummary++;
      } else {
        const dayPrompt = buildDaySummaryPrompt(userData);
        const daySummary = dayPrompt
          ? ((await callGemini(dayPrompt)) ?? buildFallbackDaySummary(userData))
          : buildFallbackDaySummary(userData);

        try {
          await prisma.calendar_logs.create({
            data: {
              user_id: userData.userId,
              date: parseDateOnly(targetDate),
              entry_type: "ai_summary",
              title: "하루 요약",
              summary: daySummary,
              payload: {
                source: "daily_conversation_summary",
                checklistCount: userData.checklists.length,
                questionCount: userData.questions.length,
                sessionCount: userData.sessionCount,
                generatedAt: new Date().toISOString(),
              } as Prisma.InputJsonValue,
            },
          });
          aiSummaryCount++;
        } catch (error) {
          const msg = `ai_summary: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(msg);
        }
      }

      const answeredQuestions = userData.questions.filter(
        (q) => q.answered && q.answer,
      );
      for (const q of answeredQuestions) {
        const key = `${userData.userId}:${q.question}`;
        if (existingQuestionKeys.has(key)) {
          skippedQuestionSummary++;
          continue;
        }

        try {
          await prisma.calendar_logs.create({
            data: {
              user_id: userData.userId,
              date: parseDateOnly(targetDate),
              entry_type: "question_summary",
              title: q.question,
              summary: q.answer!,
              payload: {
                source: "daily_question_summary",
                question: q.question,
                answer: q.answer,
                generatedAt: new Date().toISOString(),
              } as Prisma.InputJsonValue,
            },
          });
          questionSummaryCount++;
        } catch (error) {
          const msg = `question_summary: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(msg);
        }
      }
    }

    return c.json({
      targetDate,
      processedUsers: users.length,
      aiSummaries: aiSummaryCount,
      questionSummaries: questionSummaryCount,
      skippedAiSummary,
      skippedQuestionSummary,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (error) {
    console.error("internal daily-summary route error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "daily summary trigger failed",
      },
      500,
    );
  }
});

export default app;
