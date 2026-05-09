import { markQuestionAnswered } from "./question-event-sync";

describe("markQuestionAnswered", () => {
  it("marks a sent question answered without storing a navigation label as the answer", async () => {
    const updateMany = jest
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValue({ count: 0 });

    const count = await markQuestionAnswered({
      prisma: {
        user_question_events: {
          findFirst: jest.fn(),
          create: jest.fn(),
          updateMany,
        },
      },
      userId: "user-1",
      sessionId: "session-1",
      questionId: "question-1",
      answerText: "",
    });

    expect(count).toBe(1);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          answer_text: expect.anything(),
        }),
      }),
    );
  });

  it("updates the sent question by user and question when the session id differs", async () => {
    const updateMany = jest
      .fn()
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });

    const count = await markQuestionAnswered({
      prisma: {
        user_question_events: {
          findFirst: jest.fn(),
          create: jest.fn(),
          updateMany,
        },
      },
      userId: "user-1",
      sessionId: "session-1",
      questionId: "question-1",
      answerText: "따뜻하게 쉬고 싶어요.",
    });

    expect(count).toBe(1);
    expect(updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          user_id: "user-1",
          question_id: "question-1",
          status: "sent",
          answered_at: null,
        },
        data: expect.objectContaining({
          status: "answered",
          answer_text: "따뜻하게 쉬고 싶어요.",
        }),
      }),
    );
  });

  it("creates an answered event when no sent row exists", async () => {
    const create = jest.fn().mockResolvedValue({});
    const count = await markQuestionAnswered({
      prisma: {
        user_question_events: {
          findFirst: jest.fn(),
          create,
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      },
      userId: "user-1",
      sessionId: "session-1",
      questionId: "question-1",
      answerText: "천천히 마음을 살피고 싶어요.",
      answerMessageId: "message-1",
    });

    expect(count).toBe(1);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: "user-1",
        question_id: "question-1",
        session_id: "session-1",
        answer_message_id: "message-1",
        status: "answered",
        answer_text: "천천히 마음을 살피고 싶어요.",
      }),
    });
  });
});
