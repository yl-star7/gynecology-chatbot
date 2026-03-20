import { NextRequest, NextResponse } from "next/server";
import { runProactiveChatForEligibleUsers } from "@/lib/mobile/proactive-chat";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runProactiveChatForEligibleUsers();
    return NextResponse.json(result);
  } catch (error) {
    console.error("cron proactive-chat error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "proactive chat failed" },
      { status: 500 },
    );
  }
}
