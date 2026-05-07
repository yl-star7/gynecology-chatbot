var mockedPrisma: any;

jest.mock("@gynecology-chatbot/db/prisma", () => {
  mockedPrisma = {
    users: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    chat_sessions: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    chat_messages: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    user_question_events: {
      findMany: jest.fn(),
    },
    calendar_logs: {
      findMany: jest.fn(),
    },
    user_action_logs: {
      findMany: jest.fn(),
    },
  };

  return { prisma: mockedPrisma };
});

jest.mock("@/lib/mobile/solapi-sms", () => ({
  normalizePhoneNumberToE164: jest.fn((phoneNumber: string) =>
    phoneNumber === "01012345678" ? "+821012345678" : phoneNumber,
  ),
}));

jest.mock("@/lib/privacy/phone-crypto", () => ({
  computePhoneNumberBlindIndex: jest.fn(
    (phoneNumber: string) => `idx:${phoneNumber}`,
  ),
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
}));

jest.mock("@/lib/db/admin-client", () => ({
  dbSelect: jest.fn(),
}));

import { dbSelect } from "@/lib/db/admin-client";

import {
  fetchChatActions,
  fetchChatSessionMessages,
  fetchChatUserDetail,
} from "./load-chat-data";

const userId = "6e789ecc-d48a-4535-8ad9-1303dcddb8e5";
const mockedDbSelect = jest.mocked(dbSelect);

describe("fetchChatActions", () => {
  afterEach(() => {
    mockedPrisma.users.findUnique.mockReset();
    mockedPrisma.users.findMany.mockReset();
    mockedPrisma.chat_sessions.findFirst.mockReset();
    mockedPrisma.chat_sessions.findMany.mockReset();
    mockedPrisma.chat_messages.groupBy.mockReset();
    mockedPrisma.chat_messages.findMany.mockReset();
    mockedPrisma.user_question_events.findMany.mockReset();
    mockedPrisma.calendar_logs.findMany.mockReset();
    mockedPrisma.user_action_logs.findMany.mockReset();
    mockedDbSelect.mockReset();
  });

  it("resolves a phone number filter to action log user ids and returns phone display data", async () => {
    mockedPrisma.users.findMany
      .mockResolvedValueOnce([{ id: userId }])
      .mockResolvedValueOnce([
        {
          id: userId,
          phone_number: "",
          phone_number_encrypted: "enc:+821012345678",
          phone_number_last4: "5678",
          pregnancy_profiles: { display_name: "김수연" },
        },
      ]);
    mockedPrisma.user_action_logs.findMany
      .mockResolvedValueOnce([
        {
          id: "log-1",
          user_id: userId,
          action_type: "phone_verification_started",
          payload: { flow: "sign_in" },
          occurred_at: new Date("2026-04-29T00:17:00.000Z"),
        },
      ])
      .mockResolvedValueOnce([{ action_type: "phone_verification_started" }]);

    const result = await fetchChatActions(
      {
        phoneNumber: "01012345678",
        actionType: "all",
        from: "",
        to: "",
      },
      200,
    );

    const lookupCall = mockedPrisma.users.findMany.mock.calls[0][0];
    expect(lookupCall.where.OR).toEqual(
      expect.arrayContaining([
        { phone_number_blind_index: "idx:01012345678" },
        { phone_number_blind_index: "idx:+821012345678" },
      ]),
    );

    const actionLookupCall =
      mockedPrisma.user_action_logs.findMany.mock.calls[0][0];
    expect(actionLookupCall.where).toEqual({ user_id: { in: [userId] } });
    expect(result.actions).toEqual([
      {
        id: "log-1",
        userId,
        userLabel: "김수연",
        phoneNumber: "+821012345678",
        actionType: "phone_verification_started",
        detail: '{"flow":"sign_in"}',
        occurredAt: "2026-04-29T00:17:00.000Z",
      },
    ]);
  });
});

describe("fetchChatUserDetail", () => {
  afterEach(() => {
    mockedPrisma.users.findUnique.mockReset();
    mockedPrisma.chat_sessions.findMany.mockReset();
    mockedPrisma.chat_messages.groupBy.mockReset();
    mockedDbSelect.mockReset();
  });

  it("loads local text-id users through the DB client", async () => {
    mockedDbSelect
      .mockResolvedValueOnce([
        {
          id: "local-user-demo",
          account_status: "active",
          phone_number_encrypted: "enc:+821012345678",
          phone_number_last4: "5678",
          created_at: "2026-05-06T00:00:00.000Z",
          last_login_at: "2026-05-07T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          display_name: "김수연",
          pregnancy_week: 32,
          pregnancy_day_in_week: 1,
          week_override: null,
          day_override: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "local-session-1",
          title: "오늘의 질문",
          status: "active",
          last_message_at: "2026-05-07T01:00:00.000Z",
          created_at: "2026-05-07T00:30:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        { session_id: "local-session-1" },
        { session_id: "local-session-1" },
      ]);

    const result = await fetchChatUserDetail("local-user-demo");

    expect(mockedPrisma.users.findUnique).not.toHaveBeenCalled();
    expect(mockedDbSelect).toHaveBeenCalledWith(
      expect.stringContaining("users?select="),
    );
    expect(result?.profile.userId).toBe("local-user-demo");
    expect(result?.sessions).toEqual([
      {
        sessionId: "local-session-1",
        title: "오늘의 질문",
        status: "active",
        lastMessageAt: "2026-05-07T01:00:00.000Z",
        createdAt: "2026-05-07T00:30:00.000Z",
        messageCount: 2,
      },
    ]);
  });
});

describe("fetchChatSessionMessages", () => {
  afterEach(() => {
    mockedPrisma.users.findUnique.mockReset();
    mockedPrisma.users.findMany.mockReset();
    mockedPrisma.chat_sessions.findFirst.mockReset();
    mockedPrisma.chat_sessions.findMany.mockReset();
    mockedPrisma.chat_messages.groupBy.mockReset();
    mockedPrisma.chat_messages.findMany.mockReset();
    mockedPrisma.user_question_events.findMany.mockReset();
    mockedPrisma.calendar_logs.findMany.mockReset();
    mockedPrisma.user_action_logs.findMany.mockReset();
    mockedDbSelect.mockReset();
  });

  it("returns question answer events with message logs for the session", async () => {
    const sessionId = "9bb8145c-937a-4f63-b9dd-68e666091c5a";
    const questionId = "ecbc209d-b393-478f-a8da-18d9c51f9f35";

    mockedPrisma.chat_sessions.findFirst.mockResolvedValue({
      id: sessionId,
      title: "오늘의 질문",
    });
    mockedPrisma.chat_messages.findMany.mockResolvedValue([
      {
        id: "message-1",
        role: "user",
        plain_text: "배가 무거워요.",
        parts: [{ type: "text", text: "배가 무거워요." }],
        model_name: null,
        created_at: new Date("2026-05-06T21:35:00.000Z"),
      },
    ]);
    mockedPrisma.user_question_events.findMany.mockResolvedValue([
      {
        id: "event-1",
        question_id: questionId,
        status: "answered",
        sent_at: new Date("2026-05-06T21:34:00.000Z"),
        answered_at: new Date("2026-05-06T21:35:00.000Z"),
        answer_text: "배가 무거워요.",
        content_week_questions: {
          question_text: "이번 주 가장 뚜렷하게 느낀 변화는 무엇인가요?",
        },
      },
    ]);
    mockedPrisma.calendar_logs.findMany.mockResolvedValue([
      {
        summary: "배가 무거운 변화를 또렷하게 느꼈다고 요약됐어요.",
        payload: { questionId },
      },
    ]);

    const result = await fetchChatSessionMessages(userId, sessionId);

    expect(mockedPrisma.user_question_events.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: userId, session_id: sessionId },
      }),
    );
    expect(result?.questionAnswers).toEqual([
      {
        eventId: "event-1",
        questionId,
        questionText: "이번 주 가장 뚜렷하게 느낀 변화는 무엇인가요?",
        answerText: "배가 무거워요.",
        appSummary: "배가 무거운 변화를 또렷하게 느꼈다고 요약됐어요.",
        status: "answered",
        sentAt: "2026-05-06T21:34:00.000Z",
        answeredAt: "2026-05-06T21:35:00.000Z",
      },
    ]);
  });

  it("uses the same pending-answer display as the mobile record API", async () => {
    const sessionId = "9bb8145c-937a-4f63-b9dd-68e666091c5a";
    const questionId = "ecbc209d-b393-478f-a8da-18d9c51f9f35";

    mockedPrisma.chat_sessions.findFirst.mockResolvedValue({
      id: sessionId,
      title: "오늘의 질문",
    });
    mockedPrisma.chat_messages.findMany.mockResolvedValue([]);
    mockedPrisma.user_question_events.findMany.mockResolvedValue([
      {
        id: "event-1",
        question_id: questionId,
        status: "answered",
        sent_at: new Date("2026-05-06T21:34:00.000Z"),
        answered_at: new Date("2026-05-06T21:35:00.000Z"),
        answer_text: "몸이 무거웠지만 아기가 잘 자란다고 생각했어요.",
        content_week_questions: {
          question_text: "이번 주 가장 뚜렷하게 느낀 변화는 무엇인가요?",
        },
      },
    ]);
    mockedPrisma.calendar_logs.findMany.mockResolvedValue([
      {
        title: "이번 주 가장 뚜렷하게 느낀 변화는 무엇인가요?",
        summary: "질문 답변 대기 (q1)",
        entry_type: "question_summary",
        session_id: sessionId,
        payload: {
          source: "attachment_question_followup",
          questionId,
          compactSummary: "현재 단계: 질문 답변 대기 (q1)",
        },
      },
    ]);

    const result = await fetchChatSessionMessages(userId, sessionId);

    expect(result?.questionAnswers[0]?.appSummary).toBe(
      "몸이 무거웠지만 아기가 잘 자란다고 생각했어요.",
    );
  });

  it("loads local text-id chat sessions through the DB client", async () => {
    mockedDbSelect
      .mockResolvedValueOnce([
        {
          id: "local-session-1",
          title: "오늘의 질문",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "message-1",
          role: "user",
          plain_text: "아기야 고마워.",
          parts: [{ type: "text", text: "아기야 고마워." }],
          model_name: null,
          created_at: "2026-05-07T01:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "event-1",
          question_id: "week-question-32-general-baby-message",
          status: "answered",
          sent_at: "2026-05-07T00:59:00.000Z",
          answered_at: "2026-05-07T01:00:00.000Z",
          answer_text: "아기야 고마워.",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "week-question-32-general-baby-message",
          question_text: "오늘 아기에게 들려주고 싶은 말은 무엇인가요?",
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await fetchChatSessionMessages(
      "local-user-demo",
      "local-session-1",
    );

    expect(mockedPrisma.chat_sessions.findFirst).not.toHaveBeenCalled();
    expect(mockedDbSelect).toHaveBeenCalledWith(
      expect.stringContaining("chat_sessions?select=id,title"),
    );
    expect(result?.messages).toEqual([
      {
        messageId: "message-1",
        role: "user",
        plainText: "아기야 고마워.",
        partsSummary: "text",
        modelName: null,
        createdAt: "2026-05-07T01:00:00.000Z",
      },
    ]);
    expect(result?.questionAnswers[0]).toEqual({
      eventId: "event-1",
      questionId: "week-question-32-general-baby-message",
      questionText: "오늘 아기에게 들려주고 싶은 말은 무엇인가요?",
      answerText: "아기야 고마워.",
      appSummary: "아기야 고마워.",
      status: "answered",
      sentAt: "2026-05-07T00:59:00.000Z",
      answeredAt: "2026-05-07T01:00:00.000Z",
    });
  });
});
