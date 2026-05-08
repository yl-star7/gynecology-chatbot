import { NextRequest, NextResponse } from "next/server";
import { loadMobileChatSession } from "@gynecology-chatbot/mobile-api/chat/session-route-helpers";

import {
  mobileNoStoreJson,
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { sessionId } = await context.params;
    const { userId } = await requireMobileSession(request, hintedUserId);
    const session = await loadMobileChatSession(userId, sessionId);

    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }

    return mobileNoStoreJson({
      session,
    });
  } catch (error) {
    console.error("mobile session detail route error", error);
    return mobileRouteErrorResponse(error, "failed to load session");
  }
}
