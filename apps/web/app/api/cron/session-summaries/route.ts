import { NextRequest, NextResponse } from "next/server";
import { summarizeUnsummarizedMobileChatSessions } from "@gynecology-chatbot/mobile-api/chat/session-summary";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const targetDate =
      request.nextUrl.searchParams.get("targetDate") ?? undefined;
    const limitText = request.nextUrl.searchParams.get("limit");
    const limit = limitText ? Number(limitText) : undefined;
    const result = await summarizeUnsummarizedMobileChatSessions({
      targetDate,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("cron session-summaries error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "session summary cron failed",
      },
      { status: 500 },
    );
  }
}
