import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { runProactiveChatForEligibleUsers } from "@/lib/mobile/proactive-chat";

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const triggerId =
      typeof body.triggerId === "string" ? body.triggerId : "daily_check";

    const result = await runProactiveChatForEligibleUsers();

    return NextResponse.json({ triggerId, ...result });
  } catch (error) {
    console.error("admin proactive trigger error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to run proactive chat",
      },
      { status: 500 },
    );
  }
}
