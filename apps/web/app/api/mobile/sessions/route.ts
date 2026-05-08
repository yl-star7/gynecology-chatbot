import { NextRequest } from "next/server";
import { loadMobileChatSessions } from "@gynecology-chatbot/mobile-api/chat/session-route-helpers";
import {
  mobileNoStoreJson,
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

export async function GET(request: NextRequest) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);
    const sessions = await loadMobileChatSessions(userId);

    return mobileNoStoreJson({
      sessions,
    });
  } catch (error) {
    console.error("mobile sessions route error", error);
    return mobileRouteErrorResponse(error, "failed to load sessions");
  }
}
