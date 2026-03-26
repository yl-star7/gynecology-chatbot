jest.mock("expo-server-sdk", () => {
  return jest.fn().mockImplementation(() => ({
    chunkPushNotifications: (messages: unknown[]) => [messages],
    sendPushNotificationsAsync: jest.fn(async (messages: unknown[]) => messages),
  }));
});

jest.mock("./supabase-rest", () => ({
  supabaseSelect: jest.fn(),
}));

jest.mock("@/lib/privacy/phone-crypto", () => ({
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
}));

jest.mock("./twilio-verify", () => ({
  sendSmsMessage: jest.fn(async () => ({
    sid: "mock-message",
    status: "queued",
    to: "+821012345678",
  })),
}));

import Expo from "expo-server-sdk";

import { supabaseSelect } from "./supabase-rest";
import { sendDailyPushNotifications } from "./push-sender";
import { sendSmsMessage } from "./twilio-verify";

describe("sendDailyPushNotifications", () => {
  beforeEach(() => {
    (supabaseSelect as jest.Mock).mockReset();
    (sendSmsMessage as jest.Mock).mockClear();
  });

  test("falls back to SMS for notification-enabled users without push tokens", async () => {
    (supabaseSelect as jest.Mock).mockImplementation(async (path: string) => {
      if (path.startsWith("pregnancy_profiles?")) {
        return [
          {
            user_id: "user-1",
            push_token: null,
            pregnancy_week: 18,
            display_name: "김수연",
            notification_time: "09:00",
          },
        ];
      }

      if (path.startsWith("users?")) {
        return [
          {
            id: "user-1",
            phone_number_encrypted: "enc:+821012345678",
          },
        ];
      }

      return [];
    });

    const result = await sendDailyPushNotifications();

    expect(sendSmsMessage).toHaveBeenCalledWith(
      "+821012345678",
      expect.stringContaining("임신 18주차"),
    );
    expect(result).toEqual({
      sent: 1,
      total: 1,
      pushSent: 0,
      smsSent: 1,
    });
  });

  test("keeps push delivery for users with valid Expo tokens", async () => {
    (Expo as unknown as { isExpoPushToken: jest.Mock }).isExpoPushToken = jest.fn(
      () => true,
    );
    (supabaseSelect as jest.Mock).mockResolvedValue([
      {
        user_id: "user-1",
        push_token: "ExponentPushToken[abc]",
        pregnancy_week: 18,
        display_name: "김수연",
        notification_time: "09:00",
      },
    ]);

    const result = await sendDailyPushNotifications();

    expect(sendSmsMessage).not.toHaveBeenCalled();
    expect(result).toEqual({
      sent: 1,
      total: 1,
      pushSent: 1,
      smsSent: 0,
    });
  });
});
