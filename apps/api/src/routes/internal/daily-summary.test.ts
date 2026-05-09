import { afterAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

var mockedPrisma: any;

jest.mock("@gynecology-chatbot/db/prisma", () => {
  mockedPrisma = {
    user_checklist_events: {
      findMany: jest.fn(),
    },
    user_question_events: {
      findMany: jest.fn(),
    },
    calendar_logs: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  return { prisma: mockedPrisma };
});

import app from "./daily-summary";

describe("POST /api/internal/daily-summary", () => {
  const originalCronSecret = process.env.CRON_SECRET;
  const originalGeminiApiKey = process.env.GEMINI_API_KEY;
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.GEMINI_API_KEY = "test-gemini-key";
    global.fetch = fetchMock;

    mockedPrisma.user_checklist_events.findMany.mockReset();
    mockedPrisma.user_question_events.findMany.mockReset();
    mockedPrisma.calendar_logs.findMany.mockReset();
    mockedPrisma.calendar_logs.create.mockReset();
    mockedPrisma.calendar_logs.update.mockReset();
    fetchMock.mockReset();
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalCronSecret;
    process.env.GEMINI_API_KEY = originalGeminiApiKey;
  });

  it("creates one daily summary and one AI question summary per answered question", async () => {
    mockedPrisma.user_checklist_events.findMany.mockResolvedValue([]);
    mockedPrisma.user_question_events.findMany.mockResolvedValue([
      {
        user_id: "user-1",
        question_id: "question-a",
        status: "answered",
        answer_text: "아기에게 매일 짧게라도 말을 걸고 싶어요.",
        answered_at: new Date("2026-05-08T02:00:00.000Z"),
        content_week_questions: {
          question_text: "아기의 성장을 느끼며 다음 주를 어떤 마음으로 맞이하고 싶나요?",
        },
      },
      {
        user_id: "user-1",
        question_id: "question-b",
        status: "answered",
        answer_text: "몸이 힘든 날에는 무리하지 않고 쉬고 싶어요.",
        answered_at: new Date("2026-05-08T03:00:00.000Z"),
        content_week_questions: {
          question_text: "오늘 몸에게 어떤 말을 건네고 싶나요?",
        },
      },
    ]);
    mockedPrisma.calendar_logs.findMany.mockImplementation((args: any) => {
      if (args.where.entry_type === "chat_saved") return Promise.resolve([]);
      if (args.where.entry_type === "ai_summary") return Promise.resolve([]);
      if (args.where.entry_type === "question_summary") return Promise.resolve([]);
      return Promise.resolve([]);
    });
    mockedPrisma.calendar_logs.create.mockResolvedValue({});

    fetchMock.mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const prompt = body.contents[0].parts[0].text as string;
      let text =
        "이날에는 아기의 성장을 떠올리며 다음 주를 차분히 맞이하고 싶어 했어요. 몸이 힘든 날에는 무리하지 않고 쉬어가려는 마음도 함께 보였어요. 짧게라도 아기에게 말을 건네며 교감하고, 자신의 컨디션을 살피는 태도가 이어졌어요. 다음에도 몸과 마음의 신호를 천천히 확인하면 좋겠어요.";

      if (prompt.includes("다음 주를 어떤 마음으로 맞이하고 싶나요?")) {
        text =
          "아기의 성장을 느끼며 다음 주를 차분하게 맞이하고 싶어 했어요. 매일 짧게라도 말을 걸며 아기와 교감하려는 마음이 담겼어요.";
      } else if (prompt.includes("오늘 몸에게 어떤 말을 건네고 싶나요?")) {
        text =
          "몸이 힘든 날에는 무리하지 않고 쉬어가고 싶어 했어요. 자신의 컨디션을 살피며 몸에게 다정하게 반응하려는 마음이 담겼어요.";
      }

      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text }] } }],
        }),
      } as Response;
    });

    const response = await app.request("/", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-cron-secret",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ targetDate: "2026-05-08" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      aiSummaries: 1,
      questionSummaries: 2,
      updatedQuestionSummaries: 0,
    });

    expect(mockedPrisma.calendar_logs.create).toHaveBeenCalledTimes(3);
    expect(
      mockedPrisma.calendar_logs.create.mock.calls.map(
        ([input]: any[]) => input.data.entry_type,
      ),
    ).toEqual(["ai_summary", "question_summary", "question_summary"]);

    const questionCreates = mockedPrisma.calendar_logs.create.mock.calls
      .map(([input]: any[]) => input.data)
      .filter((data: any) => data.entry_type === "question_summary");
    expect(questionCreates).toEqual([
      expect.objectContaining({
        payload: expect.objectContaining({
          source: "daily_question_summary",
          questionId: "question-a",
          answer: "아기에게 매일 짧게라도 말을 걸고 싶어요.",
        }),
        summary: expect.stringContaining("매일 짧게라도 말을 걸며"),
      }),
      expect.objectContaining({
        payload: expect.objectContaining({
          source: "daily_question_summary",
          questionId: "question-b",
          answer: "몸이 힘든 날에는 무리하지 않고 쉬고 싶어요.",
        }),
        summary: expect.stringContaining("무리하지 않고 쉬어가고"),
      }),
    ]);
  });
});
