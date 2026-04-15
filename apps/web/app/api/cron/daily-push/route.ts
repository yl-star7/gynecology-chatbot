import { NextRequest, NextResponse } from "next/server";
import { sendDailyPushNotifications } from "@/lib/mobile/push-sender";

const NOTIFICATION_TIME_ZONE = "Asia/Seoul";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendDailyPushNotifications({
      respectUserTime: true,
      now: new Date(),
      timeZone: NOTIFICATION_TIME_ZONE,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("cron daily-push error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "daily push delivery failed",
      },
      { status: 500 },
    );
  }
}
