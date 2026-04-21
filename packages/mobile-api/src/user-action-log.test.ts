jest.mock("@/lib/db/admin-client", () => ({
  dbInsert: jest.fn().mockResolvedValue([]),
  getSupabaseAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

import { dbInsert } from "@/lib/db/admin-client";

import { recordUserAction } from "./user-action-log";

const mockedInsert = dbInsert as jest.MockedFunction<
  typeof dbInsert
>;

describe("recordUserAction", () => {
  afterEach(() => {
    mockedInsert.mockReset();
    jest.restoreAllMocks();
  });

  it("writes user action rows to Supabase", async () => {
    mockedInsert.mockResolvedValueOnce([]);

    await recordUserAction({
      userId: "user-1",
      actionType: "chat_message_sent",
      sessionId: "session-1",
      messageId: "message-1",
      payload: {
        textPreview: "안녕하세요",
        imageCount: 1,
      },
    });

    expect(mockedInsert).toHaveBeenCalledWith("user_action_logs", {
      user_id: "user-1",
      session_id: "session-1",
      message_id: "message-1",
      action_type: "chat_message_sent",
      payload: {
        textPreview: "안녕하세요",
        imageCount: 1,
      },
    });
  });

  it("swallows insert failures and warns instead", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockedInsert.mockRejectedValueOnce(new Error("insert failed"));

    await expect(
      recordUserAction({
        userId: "user-1",
        actionType: "login_succeeded",
      }),
    ).resolves.toBeUndefined();

    expect(warning).toHaveBeenCalledWith(
      "failed to record user action",
      expect.any(Error),
    );
  });
});
