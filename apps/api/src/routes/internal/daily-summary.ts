import { Hono } from "hono";
import {
  addCalendarDays,
  createKoreanDateKey,
  createKoreanDateTime,
} from "@gynecology-chatbot/app-core/time";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import {
  buildFallbackQuestionAnswerSummary,
  buildQuestionSummaryTitle,
  isQuestionAnswerText,
} from "@gynecology-chatbot/mobile-api/chat/question-summary";

const app = new Hono();
const DAY_SUMMARY_VERSION = "detailed_150_170_v3";
const DAY_SUMMARY_MIN_CHARS = 150;
const DAY_SUMMARY_MAX_CHARS = 170;
const DAY_SUMMARY_MAX_OUTPUT_TOKENS = 240;
const QUESTION_SUMMARY_MAX_OUTPUT_TOKENS = 200;

type UserDayData = {
  userId: string;
  checklists: Array<{
    title: string;
    answer: string | null;
    completed: boolean;
  }>;
  questions: Array<{
    questionId: string | null;
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
  return addCalendarDays(createKoreanDateKey(), -1);
}

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function createKstDayRange(isoDate: string) {
  return {
    start: createKoreanDateTime({ isoDate }),
    end: createKoreanDateTime({ isoDate: addCalendarDays(isoDate, 1) }),
  };
}

function asObject<T>(value: Prisma.JsonValue | null | undefined): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}

async function fetchUserDayData(targetDate: string): Promise<UserDayData[]> {
  const dayDate = parseDateOnly(targetDate);
  const dayRange = createKstDayRange(targetDate);

  const [rawChecklists, rawQuestions, rawChats] = await Promise.all([
    prisma.user_checklist_events.findMany({
      where: {
        updated_at: {
          gte: dayRange.start,
          lt: dayRange.end,
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
          gte: dayRange.start,
          lt: dayRange.end,
        },
      },
      select: {
        user_id: true,
        answer_text: true,
        status: true,
        answered_at: true,
        question_id: true,
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
      questionId: row.question_id,
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

async function callGemini(
  prompt: string,
  options: { maxOutputTokens?: number } = {},
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens:
            options.maxOutputTokens ?? QUESTION_SUMMARY_MAX_OUTPUT_TOKENS,
          temperature: 0.3,
        },
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

function normalizeSummaryText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function countSummaryChars(value: string) {
  return normalizeSummaryText(value).length;
}

function limitSummaryText(value: string, maxLength: number) {
  const normalized = normalizeSummaryText(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength).trimEnd();
}

async function buildGeneratedDaySummary(input: {
  prompt: string;
  fallback: string;
}) {
  const generated = await callGemini(input.prompt, {
    maxOutputTokens: DAY_SUMMARY_MAX_OUTPUT_TOKENS,
  });
  const firstSummary = generated ?? input.fallback;

  if (generated && countSummaryChars(firstSummary) < DAY_SUMMARY_MIN_CHARS) {
    const expanded = await callGemini(
      [
        "아래 요약을 의미는 유지하되 조금 더 자세하게 다시 써 주세요.",
        `반드시 한글 글자 기준 ${DAY_SUMMARY_MIN_CHARS}~${DAY_SUMMARY_MAX_CHARS}자 사이로 맞춰 주세요.`,
        "진단 표현, 의료 단정 표현, '요약:' 머리말은 쓰지 마세요.",
        "",
        `[요약]\n${firstSummary}`,
      ].join("\n"),
      { maxOutputTokens: DAY_SUMMARY_MAX_OUTPUT_TOKENS },
    );
    if (expanded) {
      return limitSummaryText(expanded, DAY_SUMMARY_MAX_CHARS);
    }
  }

  return limitSummaryText(firstSummary, DAY_SUMMARY_MAX_CHARS);
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
    "그날의 모든 채팅과 활동을 하나의 전체 대화 요약으로 정리해 주세요.",
    `따뜻한 톤(-어요/-해요 체)으로 한글 자모/글자 기준 ${DAY_SUMMARY_MIN_CHARS}~${DAY_SUMMARY_MAX_CHARS}자 사이로 작성해 주세요.`,
    "문장이 너무 짧아지지 않도록 3~4문장으로 자연스럽게 이어 주세요.",
    "주요 고민, 사용자가 남긴 감정이나 질문, 안내받은 핵심 내용, 다음에 기억하면 좋은 점을 포함해 주세요.",
    "체크리스트와 날짜 질문은 대화 맥락을 보완할 때만 자연스럽게 섞어 주세요.",
    "진단 표현, 의료 단정 표현은 쓰지 말고, '요약:' 같은 머리말 없이 본문만 작성하세요.",
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
  return limitSummaryText(
    parts.length > 0
      ? `이날에는 ${parts.join(", ")}.`
      : "이날에는 활동 기록이 없어요.",
    DAY_SUMMARY_MAX_CHARS,
  );
}

function normalizeGeneratedQuestionSummary(input: {
  generated: string | null;
  answer: string;
}) {
  const summary = input.generated
    ?.replace(/\s+/g, " ")
    .replace(/^(답변\s*요약|요약|A|답)\s*[:：]\s*/i, "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .trim();
  if (!summary) return null;

  const normalizedSummary = summary.replace(/\s+/g, " ").trim();
  const normalizedAnswer = input.answer.replace(/\s+/g, " ").trim();
  if (normalizedSummary === normalizedAnswer) return null;
  if (normalizedSummary.length < 45) return null;

  return normalizedSummary.slice(0, 180);
}

async function buildQuestionAnswerSummary(input: {
  question: string;
  answer: string;
}) {
  const fallback = buildFallbackQuestionAnswerSummary({
    questionText: input.question,
    userAnswer: input.answer,
  });
  const title = buildQuestionSummaryTitle(`${input.question}\n${input.answer}`);
  const prompt = [
    "아래 질문에 대한 사용자의 답변을 기록 카드의 '답변 요약'에 들어갈 한 문장으로 요약해 주세요.",
    "원문을 그대로 반복하지 말고, 사용자가 느낀 마음이나 생각과 질문 맥락을 자연스럽게 정리해 주세요.",
    "한국어 -어요/-해요 체로 70~120자, 1~2문장으로 작성하고, 접두사나 따옴표는 쓰지 마세요.",
    "",
    `[질문]\n${input.question}`,
    "",
    `[사용자 답변]\n${input.answer}`,
  ].join("\n");

  const generated = normalizeGeneratedQuestionSummary({
    generated: await callGemini(prompt),
    answer: input.answer,
  });
  return {
    title,
    summary: generated ?? fallback,
  };
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
    let updatedQuestionSummary = 0;
    let skippedAiSummary = 0;

    const [existingAiRows, existingQuestionRows] = await Promise.all([
      prisma.calendar_logs.findMany({
        where: {
          date: parseDateOnly(targetDate),
          entry_type: "ai_summary",
        },
        select: { id: true, user_id: true, payload: true },
      }),
      prisma.calendar_logs.findMany({
        where: {
          date: parseDateOnly(targetDate),
          entry_type: "question_summary",
        },
        select: { id: true, user_id: true, payload: true },
      }),
    ]);

    const existingDailyAiRowsByUserId = new Map<
      string,
      (typeof existingAiRows)[number]
    >();
    for (const row of existingAiRows) {
      if (
        asObject<{ source?: string }>(row.payload)?.source ===
        "daily_conversation_summary"
      ) {
        existingDailyAiRowsByUserId.set(row.user_id, row);
      }
    }
    const existingQuestionRowsByKey = new Map<
      string,
      (typeof existingQuestionRows)[number]
    >();
    for (const row of existingQuestionRows) {
      const payload = asObject<{
        question?: string;
        questionId?: string;
      }>(row.payload);
      if (payload?.questionId) {
        existingQuestionRowsByKey.set(
          `${row.user_id}:${payload.questionId}`,
          row,
        );
      }
      if (payload?.question) {
        existingQuestionRowsByKey.set(
          `${row.user_id}:${payload.question}`,
          row,
        );
      }
    }

    const errors: string[] = [];

    for (const userData of users) {
      const hasActivity =
        userData.checklists.length > 0 ||
        userData.questions.length > 0 ||
        (userData.chatSnippets && userData.chatSnippets.trim().length > 0);

      if (!hasActivity) {
        continue;
      }

      const existingDailyAiRow = existingDailyAiRowsByUserId.get(
        userData.userId,
      );
      const existingDailyAiPayload = asObject<{ summaryVersion?: string }>(
        existingDailyAiRow?.payload,
      );

      if (existingDailyAiPayload?.summaryVersion === DAY_SUMMARY_VERSION) {
        skippedAiSummary++;
      } else {
        const dayPrompt = buildDaySummaryPrompt(userData);
        const fallbackDaySummary = buildFallbackDaySummary(userData);
        const daySummary = dayPrompt
          ? await buildGeneratedDaySummary({
              prompt: dayPrompt,
              fallback: fallbackDaySummary,
            })
          : fallbackDaySummary;
        const payload = {
          source: "daily_conversation_summary",
          summaryVersion: DAY_SUMMARY_VERSION,
          checklistCount: userData.checklists.length,
          questionCount: userData.questions.length,
          sessionCount: userData.sessionCount,
          generatedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue;

        try {
          if (existingDailyAiRow) {
            await prisma.calendar_logs.update({
              where: { id: existingDailyAiRow.id },
              data: {
                title: "하루 요약",
                summary: daySummary,
                payload,
              },
            });
          } else {
            await prisma.calendar_logs.create({
              data: {
                user_id: userData.userId,
                date: parseDateOnly(targetDate),
                entry_type: "ai_summary",
                title: "하루 요약",
                summary: daySummary,
                payload,
              },
            });
          }
          aiSummaryCount++;
        } catch (error) {
          const msg = `ai_summary: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(msg);
        }
      }

      const answeredQuestions = userData.questions.filter(
        (q) =>
          q.answered &&
          q.answer &&
          isQuestionAnswerText({
            userAnswer: q.answer,
            questionText: q.question,
          }),
      );
      for (const q of answeredQuestions) {
        const questionIdKey = q.questionId
          ? `${userData.userId}:${q.questionId}`
          : null;
        const questionTextKey = `${userData.userId}:${q.question}`;
        const existingQuestionRow =
          (questionIdKey
            ? existingQuestionRowsByKey.get(questionIdKey)
            : undefined) ?? existingQuestionRowsByKey.get(questionTextKey);

        try {
          const answerSummary = await buildQuestionAnswerSummary({
            question: q.question,
            answer: q.answer!,
          });
          const payload = {
            source: "daily_question_summary",
            questionId: q.questionId,
            question: q.question,
            answer: q.answer,
            answerSummary: answerSummary.summary,
            generatedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue;
          if (existingQuestionRow) {
            await prisma.calendar_logs.update({
              where: { id: existingQuestionRow.id },
              data: {
                title: answerSummary.title,
                summary: answerSummary.summary,
                payload,
              },
            });
            updatedQuestionSummary++;
          } else {
            await prisma.calendar_logs.create({
              data: {
                user_id: userData.userId,
                date: parseDateOnly(targetDate),
                entry_type: "question_summary",
                title: answerSummary.title,
                summary: answerSummary.summary,
                payload,
              },
            });
            if (questionIdKey) {
              existingQuestionRowsByKey.set(questionIdKey, {
                id: "",
                user_id: userData.userId,
                payload: payload as Prisma.JsonValue,
              });
            }
            existingQuestionRowsByKey.set(questionTextKey, {
              id: "",
              user_id: userData.userId,
              payload: payload as Prisma.JsonValue,
            });
            questionSummaryCount++;
          }
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
      updatedQuestionSummaries: updatedQuestionSummary,
      skippedAiSummary,
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
