jest.mock("@/lib/mobile/push-sender", () => ({
  sendDailyPushNotifications: jest.fn(async () => ({
    sent: 1,
    total: 1,
    pushSent: 1,
    smsSent: 0,
    smsMocked: 0,
  })),
}));

import { sendDailyPushNotifications } from "@/lib/mobile/push-sender";
import { GET } from "./route";

const mockedSendDailyPushNotifications = jest.mocked(
  sendDailyPushNotifications,
);

describe("GET /api/cron/daily-push", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    mockedSendDailyPushNotifications.mockClear();
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  test("rejects requests without the cron secret", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/cron/daily-push") as never,
    );

    expect(response.status).toBe(401);
    expect(mockedSendDailyPushNotifications).not.toHaveBeenCalled();
  });

  test("runs due daily push delivery using Korean local time", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/cron/daily-push", {
        headers: { authorization: "Bearer test-cron-secret" },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockedSendDailyPushNotifications).toHaveBeenCalledWith({
      respectUserTime: true,
      now: expect.any(Date),
      timeZone: "Asia/Seoul",
    });
  });
});
