import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { sendDailyPushNotifications } from "@/lib/mobile/push-sender";

export async function POST() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const result = await sendDailyPushNotifications();
    return NextResponse.json(result);
  } catch (error) {
    console.error("admin push send error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to send push notifications" },
      { status: 500 },
    );
  }
}
