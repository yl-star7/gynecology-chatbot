import { NextRequest, NextResponse } from "next/server";
import {
  MobileChatSessionNotFoundError,
  summarizeMobileChatSession,
} from "@gynecology-chatbot/mobile-api/chat/session-summary";
import {
  mobileNoStoreJson,
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);

    const result = await summarizeMobileChatSession({ userId, sessionId });
    return mobileNoStoreJson(result);
  } catch (error) {
    if (error instanceof MobileChatSessionNotFoundError) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }
    console.error("mobile session summarize route error", error);
    return mobileRouteErrorResponse(error, "failed to summarize session");
  }
}
