jest.mock("@gynecology-chatbot/db/prisma", () => {
  mockedPrisma = {
    chat_sessions: {
      findFirst: jest.fn(),
    },
    calendar_logs: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    chat_messages: {
      findMany: jest.fn(),
    },
    v_chat_session_activity_dates: {
      findMany: jest.fn(),
    },
  };

  return { prisma: mockedPrisma };
});

jest.mock("ai", () => ({
  generateText: jest.fn(),
}));

jest.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: jest.fn(() => () => "mock-model"),
}));

var mockedPrisma: any;

import { generateText } from "ai";
import {
  MobileChatSessionNotFoundError,
  summarizeMobileChatSession,
} from "./session-summary";

const mockedGenerateText = generateText as jest.Mock;

function buildMessage(input: {
  id: string;
  role: "user" | "assistant";
  text: string;
}) {
  return {
    id: input.id,
    role: input.role,
    plain_text: input.text,
    parts: null,
    created_at: new Date("2026-04-21T03:00:00.000Z"),
  };
}

describe("summarizeMobileChatSession", () => {
  const originalGeminiApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    mockedPrisma.chat_sessions.findFirst.mockReset();
    mockedPrisma.calendar_logs.findFirst.mockReset();
    mockedPrisma.calendar_logs.create.mockReset();
    mockedPrisma.calendar_logs.update.mockReset();
    mockedPrisma.chat_messages.findMany.mockReset();
    mockedPrisma.v_chat_session_activity_dates.findMany.mockReset();
    mockedGenerateText.mockReset();
    mockedGenerateText.mockResolvedValue({
      text: "배뭉침 걱정을 나누고 쉬는 자세를 안내받았어요.",
    });
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalGeminiApiKey;
  });

  it("creates a session-close ai_summary when no prior summary exists", async () => {
    mockedPrisma.chat_sessions.findFirst.mockResolvedValue({
      id: "session-1",
      title: "배뭉침 상담",
      last_message_at: new Date("2026-04-20T12:00:00.000Z"),
    });
    mockedPrisma.calendar_logs.findFirst.mockResolvedValue(null);
    mockedPrisma.chat_messages.findMany.mockResolvedValue([
      buildMessage({ id: "m1", role: "user", text: "배가 자주 뭉쳐요" }),
      buildMessage({
        id: "m2",
        role: "assistant",
        text: "왼쪽으로 누워 쉬어보세요.",
      }),
    ]);

    const result = await summarizeMobileChatSession({
      userId: "user-1",
      sessionId: "session-1",
    });

    expect(result).toEqual({
      summarized: true,
      summary: "배뭉침 걱정을 나누고 쉬는 자세를 안내받았어요.",
    });
    expect(mockedPrisma.calendar_logs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: "user-1",
          session_id: "session-1",
          entry_type: "ai_summary",
          title: "배뭉침 상담",
          summary: "배뭉침 걱정을 나누고 쉬는 자세를 안내받았어요.",
          payload: {
            source: "session_close",
            summaryVersion: "session_topic_v2",
            messageCount: 2,
            generatedAt: expect.any(String),
          },
        }),
      }),
    );
    expect(mockedPrisma.calendar_logs.update).not.toHaveBeenCalled();
  });

  it("updates the existing summary when the session has newer messages", async () => {
    mockedPrisma.chat_sessions.findFirst.mockResolvedValue({
      id: "session-1",
      title: "오늘 상담",
      last_message_at: new Date("2026-04-20T12:00:00.000Z"),
    });
    mockedPrisma.calendar_logs.findFirst.mockResolvedValue({
      id: "summary-1",
      payload: {
        source: "session_close",
        messageCount: 2,
      },
    });
    mockedPrisma.chat_messages.findMany.mockResolvedValue([
      buildMessage({ id: "m1", role: "user", text: "배가 자주 뭉쳐요" }),
      buildMessage({ id: "m2", role: "assistant", text: "쉬어보세요." }),
      buildMessage({ id: "m3", role: "user", text: "언제 병원에 가야 해요?" }),
      buildMessage({
        id: "m4",
        role: "assistant",
        text: "통증이나 출혈이 있으면 바로 연락하세요.",
      }),
    ]);

    const result = await summarizeMobileChatSession({
      userId: "user-1",
      sessionId: "session-1",
    });

    expect(result.summarized).toBe(true);
    expect(mockedPrisma.calendar_logs.update).toHaveBeenCalledWith({
      where: { id: "summary-1" },
      data: expect.objectContaining({
        title: "오늘 상담",
        summary: "배뭉침 걱정을 나누고 쉬는 자세를 안내받았어요.",
        payload: {
          source: "session_close",
          summaryVersion: "session_topic_v2",
          messageCount: 4,
          generatedAt: expect.any(String),
        },
      }),
    });
    expect(mockedPrisma.calendar_logs.create).not.toHaveBeenCalled();
  });

  it("skips regeneration when the existing summary already covers all messages", async () => {
    mockedPrisma.chat_sessions.findFirst.mockResolvedValue({
      id: "session-1",
      title: "오늘 상담",
      last_message_at: new Date("2026-04-20T12:00:00.000Z"),
    });
    mockedPrisma.calendar_logs.findFirst.mockResolvedValue({
      id: "summary-1",
      payload: {
        source: "session_close",
        summaryVersion: "session_topic_v2",
        messageCount: 2,
      },
    });
    mockedPrisma.chat_messages.findMany.mockResolvedValue([
      buildMessage({ id: "m1", role: "user", text: "배가 자주 뭉쳐요" }),
      buildMessage({ id: "m2", role: "assistant", text: "쉬어보세요." }),
    ]);

    const result = await summarizeMobileChatSession({
      userId: "user-1",
      sessionId: "session-1",
    });

    expect(result).toEqual({
      summarized: false,
      reason: "already_summarized",
    });
    expect(mockedGenerateText).not.toHaveBeenCalled();
    expect(mockedPrisma.calendar_logs.create).not.toHaveBeenCalled();
    expect(mockedPrisma.calendar_logs.update).not.toHaveBeenCalled();
  });

  it("throws a not-found error when the session does not belong to the user", async () => {
    mockedPrisma.chat_sessions.findFirst.mockResolvedValue(null);

    await expect(
      summarizeMobileChatSession({
        userId: "user-1",
        sessionId: "missing-session",
      }),
    ).rejects.toBeInstanceOf(MobileChatSessionNotFoundError);
  });

  it("defers same-day session summaries for the immediate route", async () => {
    mockedPrisma.chat_sessions.findFirst.mockResolvedValue({
      id: "session-1",
      title: "오늘 상담",
      last_message_at: new Date(),
    });

    const result = await summarizeMobileChatSession({
      userId: "user-1",
      sessionId: "session-1",
    });

    expect(result).toEqual({
      summarized: false,
      reason: "same_day_deferred",
    });
    expect(mockedPrisma.calendar_logs.findFirst).not.toHaveBeenCalled();
    expect(mockedPrisma.chat_messages.findMany).not.toHaveBeenCalled();
    expect(mockedGenerateText).not.toHaveBeenCalled();
  });

  it("bulk summarizes unsummarized sessions for the target date", async () => {
    const { summarizeUnsummarizedMobileChatSessions } =
      await import("./session-summary");

    mockedPrisma.v_chat_session_activity_dates.findMany.mockResolvedValue([
      {
        user_id: "user-1",
        session_id: "session-1",
      },
    ]);
    mockedPrisma.chat_sessions.findFirst.mockResolvedValue({
      id: "session-1",
      title: "전날 상담",
      last_message_at: new Date("2026-04-20T12:00:00.000Z"),
    });
    mockedPrisma.calendar_logs.findFirst.mockResolvedValue(null);
    mockedPrisma.chat_messages.findMany.mockResolvedValue([
      buildMessage({ id: "m1", role: "user", text: "밤에 잠이 안 와요" }),
      buildMessage({
        id: "m2",
        role: "assistant",
        text: "잠들기 전 루틴을 같이 정리해볼게요.",
      }),
    ]);

    const result = await summarizeUnsummarizedMobileChatSessions({
      targetDate: "2026-04-20",
    });

    expect(result).toEqual({
      targetDate: "2026-04-20",
      consideredSessions: 1,
      summarizedSessions: 1,
      skippedSessions: {
        already_summarized: 0,
        empty_summary: 0,
        not_enough_turns: 0,
        same_day_deferred: 0,
      },
      errors: [],
    });
    expect(mockedPrisma.calendar_logs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: "user-1",
          session_id: "session-1",
          date: new Date("2026-04-20T00:00:00.000Z"),
          entry_type: "ai_summary",
          title: "채팅",
          payload: {
            source: "midnight_cron",
            summaryVersion: "session_topic_v2",
            messageCount: 2,
            generatedAt: expect.any(String),
          },
        }),
      }),
    );
    expect(mockedPrisma.calendar_logs.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          session_id: "session-1",
          entry_type: "ai_summary",
          date: new Date("2026-04-20T00:00:00.000Z"),
        }),
      }),
    );
    expect(mockedPrisma.chat_messages.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          session_id: "session-1",
          created_at: {
            gte: new Date("2026-04-19T15:00:00.000Z"),
            lt: new Date("2026-04-20T15:00:00.000Z"),
          },
        }),
      }),
    );
  });

  it("bulk skips sessions that already have a summary for the target date", async () => {
    const { summarizeUnsummarizedMobileChatSessions } =
      await import("./session-summary");

    mockedPrisma.v_chat_session_activity_dates.findMany.mockResolvedValue([
      {
        user_id: "user-1",
        session_id: "session-1",
      },
    ]);
    mockedPrisma.chat_sessions.findFirst.mockResolvedValue({
      id: "session-1",
      title: "전날 상담",
      last_message_at: new Date("2026-04-20T12:00:00.000Z"),
    });
    mockedPrisma.calendar_logs.findFirst.mockResolvedValue({
      id: "summary-1",
      payload: {
        summaryVersion: "session_topic_v2",
      },
    });
    mockedPrisma.chat_messages.findMany.mockResolvedValue([
      buildMessage({ id: "m1", role: "user", text: "밤에 잠이 안 와요" }),
      buildMessage({
        id: "m2",
        role: "assistant",
        text: "잠들기 전 루틴을 같이 정리해볼게요.",
      }),
    ]);

    const result = await summarizeUnsummarizedMobileChatSessions({
      targetDate: "2026-04-20",
    });

    expect(result).toEqual({
      targetDate: "2026-04-20",
      consideredSessions: 1,
      summarizedSessions: 0,
      skippedSessions: {
        already_summarized: 1,
        empty_summary: 0,
        not_enough_turns: 0,
        same_day_deferred: 0,
      },
      errors: [],
    });
    expect(mockedGenerateText).not.toHaveBeenCalled();
    expect(mockedPrisma.calendar_logs.create).not.toHaveBeenCalled();
    expect(mockedPrisma.calendar_logs.update).not.toHaveBeenCalled();
  });
});
