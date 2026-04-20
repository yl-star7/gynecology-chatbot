jest.mock("expo-server-sdk", () => {
  const Expo = jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: jest.fn(async (messages: unknown[]) => messages),
  }));
  (Expo as unknown as { isExpoPushToken: (value: string) => boolean }).isExpoPushToken = jest.fn(
    () => true,
  );
  return Expo;
});

jest.mock("ai", () => ({
  generateText: jest.fn(async () => ({ text: "오늘도 잘하고 있어요" })),
}));

jest.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: jest.fn(() => () => "mock-model"),
}));

jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseInsert: jest.fn(),
  supabaseSelect: jest.fn(),
}));

import { supabaseInsert, supabaseSelect } from "@/lib/supabase/admin-client";
import { runProactiveChatForEligibleUsers } from "./proactive-chat";

describe("runProactiveChatForEligibleUsers", () => {
  const originalGeminiApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    (supabaseSelect as jest.Mock).mockReset();
    (supabaseInsert as jest.Mock).mockReset();
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalGeminiApiKey;
  });

  it("uses provider-aware wrappers for reads and writes", async () => {
    (supabaseSelect as jest.Mock).mockImplementation(async (path: string) => {
      if (path.startsWith("pregnancy_profiles?")) {
        return [
          {
            user_id: "user-1",
            push_token: "ExponentPushToken[abc]",
            pregnancy_week: 18,
            display_name: "김수연",
          },
        ];
      }

      if (path.startsWith("chat_sessions?")) {
        return [];
      }

      return [];
    });

    (supabaseInsert as jest.Mock)
      .mockResolvedValueOnce([{ id: "session-1" }])
      .mockResolvedValueOnce([]);

    const result = await runProactiveChatForEligibleUsers();

    expect(result).toMatchObject({ scheduled: 1, errors: [] });
    expect(supabaseSelect).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("pregnancy_profiles?select=user_id,push_token,pregnancy_week,display_name"),
    );
    expect(supabaseSelect).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("chat_sessions?select=user_id,last_message_at"),
    );
    expect(supabaseInsert).toHaveBeenNthCalledWith(
      1,
      "chat_sessions",
      expect.objectContaining({
        user_id: "user-1",
        title: "일일 안부",
      }),
    );
    expect(supabaseInsert).toHaveBeenNthCalledWith(
      2,
      "calendar_logs",
      expect.objectContaining({
        user_id: "user-1",
        session_id: "session-1",
        entry_type: "ai_summary",
      }),
    );
  });
});
