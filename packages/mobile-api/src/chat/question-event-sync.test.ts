import {
  markQuestionAnswered,
  recordQuestionSent,
} from "./question-event-sync";
import { dbInsert, dbSelect, dbUpdate } from "../db/admin-client";

jest.mock("../db/admin-client", () => ({
  dbInsert: jest.fn(),
  dbSelect: jest.fn(),
  dbUpdate: jest.fn(),
}));

const mockedDbInsert = jest.mocked(dbInsert);
const mockedDbSelect = jest.mocked(dbSelect);
const mockedDbUpdate = jest.mocked(dbUpdate);

describe("question event sync", () => {
  beforeEach(() => {
    mockedDbInsert.mockReset();
    mockedDbSelect.mockReset();
    mockedDbUpdate.mockReset();
  });

  it("records selected text question ids without a UUID requirement", async () => {
    mockedDbSelect.mockResolvedValueOnce([]);

    await recordQuestionSent({
      userId: "local-user-demo",
      sessionId: "local-session-1",
      questionId: "week-question-32-general-baby-message",
    });

    expect(mockedDbSelect).toHaveBeenCalledWith(
      expect.stringContaining(
        "question_id=eq.week-question-32-general-baby-message",
      ),
    );
    expect(mockedDbInsert).toHaveBeenCalledWith(
      "user_question_events",
      expect.objectContaining({
        user_id: "local-user-demo",
        session_id: "local-session-1",
        question_id: "week-question-32-general-baby-message",
        status: "sent",
      }),
    );
  });

  it("marks every open selected question event as answered", async () => {
    mockedDbSelect.mockResolvedValueOnce([
      { id: "event-1" },
      { id: "event-2" },
    ]);

    const count = await markQuestionAnswered({
      userId: "local-user-demo",
      sessionId: "local-session-1",
      questionId: "week-question-32-general-baby-message",
      answerText: "오늘도 잘 자라줘서 고마워.",
    });

    expect(count).toBe(2);
    expect(mockedDbUpdate).toHaveBeenCalledTimes(2);
    expect(mockedDbUpdate).toHaveBeenNthCalledWith(
      1,
      "user_question_events?id=eq.event-1",
      expect.objectContaining({
        status: "answered",
        answer_text: "오늘도 잘 자라줘서 고마워.",
      }),
    );
  });
});
