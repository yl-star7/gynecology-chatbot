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
});
