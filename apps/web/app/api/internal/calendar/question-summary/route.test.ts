var mockedPrisma: any;

jest.mock("@gynecology-chatbot/db/prisma", () => {
  mockedPrisma = {
    calendar_logs: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  return { prisma: mockedPrisma };
});

import { POST } from "./route";

describe("POST /api/internal/calendar/question-summary", () => {
  const originalSecret = process.env.CALENDAR_SUMMARY_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.CALENDAR_SUMMARY_WEBHOOK_SECRET = "test-secret";
    mockedPrisma.calendar_logs.findFirst.mockReset();
    mockedPrisma.calendar_logs.create.mockReset();
    mockedPrisma.calendar_logs.update.mockReset();
  });

  afterAll(() => {
    process.env.CALENDAR_SUMMARY_WEBHOOK_SECRET = originalSecret;
  });

  it("replaces a stored midnight placeholder with the user's answer", async () => {
    mockedPrisma.calendar_logs.findFirst.mockResolvedValue({
      id: "summary-1",
      summary: "오늘 자정에 요약이 준비됩니다.",
      payload: {
        questionId: "question-1",
        compactSummary: "오늘 자정에 요약이 준비됩니다.",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/internal/calendar/question-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-secret",
        },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          workflowStage: 2,
          selectedQuestionId: "question-1",
          questionText: "엄마가 될 준비를 보며 어떤 마음이 드나요?",
          userAnswer: "아기를 만나기 위해 몸과 마음을 준비하고 있어요.",
          assistantAnswer: "그 마음을 차분히 바라봐주고 계세요.",
          compactSummary: "현재 단계: 질문 답변 중",
          dateKey: "2026-04-28",
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockedPrisma.calendar_logs.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "summary-1" },
        data: expect.objectContaining({
          summary: "아기를 만나기 위해 몸과 마음을 준비하고 있어요.",
        }),
      }),
    );
    expect(mockedPrisma.calendar_logs.create).not.toHaveBeenCalled();
  });
});
