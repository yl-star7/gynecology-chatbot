jest.mock("expo-server-sdk", () => {
  return jest.fn().mockImplementation(() => ({
    chunkPushNotifications: (messages: unknown[]) => [messages],
    sendPushNotificationsAsync: jest.fn(
      async (messages: unknown[]) => messages,
    ),
  }));
});

jest.mock("@/lib/db/admin-client", () => ({
  dbSelect: jest.fn(),
}));

jest.mock("@/lib/privacy/phone-crypto", () => ({
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
}));

jest.mock("./solapi-sms", () => ({
  sendSmsMessage: jest.fn(async () => ({
    sid: "mock-message",
    status: "queued",
    to: "+821012345678",
  })),
}));

import Expo from "expo-server-sdk";

import { dbSelect } from "@/lib/db/admin-client";
import { sendDailyPushNotifications } from "./push-sender";
import { sendSmsMessage } from "./solapi-sms";

describe("sendDailyPushNotifications", () => {
  beforeEach(() => {
    (dbSelect as jest.Mock).mockReset();
    (sendSmsMessage as jest.Mock).mockClear();
  });

  test("falls back to SMS for notification-enabled users without push tokens", async () => {
    (dbSelect as jest.Mock).mockImplementation(async (path: string) => {
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
      sent: 0,
      total: 1,
      pushSent: 0,
      smsSent: 0,
      smsMocked: 1,
    });
  });

  test("keeps push delivery for users with valid Expo tokens", async () => {
    (Expo as unknown as { isExpoPushToken: jest.Mock }).isExpoPushToken =
      jest.fn(() => true);
    (dbSelect as jest.Mock).mockResolvedValue([
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
      smsMocked: 0,
    });
  });

  test("sends scheduled pushes only to users whose notification time is due in Korea", async () => {
    (Expo as unknown as { isExpoPushToken: jest.Mock }).isExpoPushToken =
      jest.fn(() => true);
    (dbSelect as jest.Mock).mockResolvedValue([
      {
        user_id: "user-1",
        push_token: "ExponentPushToken[due]",
        pregnancy_week: 18,
        display_name: "김수연",
        notification_time: "08:30",
      },
      {
        user_id: "user-2",
        push_token: "ExponentPushToken[later]",
        pregnancy_week: 20,
        display_name: "이하늘",
        notification_time: "09:00",
      },
    ]);

    const result = await sendDailyPushNotifications({
      respectUserTime: true,
      now: new Date("2026-04-15T23:30:00.000Z"),
      timeZone: "Asia/Seoul",
    });

    expect(result).toEqual({
      sent: 1,
      total: 1,
      pushSent: 1,
      smsSent: 0,
      smsMocked: 0,
    });
  });
});
