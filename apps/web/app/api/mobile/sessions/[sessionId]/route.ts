import { NextRequest, NextResponse } from "next/server";
import {
  mobileNoStoreJson,
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/supabase/admin-client";
import { toChatSession } from "@/lib/mobile/serializers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { sessionId } = await context.params;
    const { userId } = await requireMobileSession(request, hintedUserId);

    const [sessions, messages] = await Promise.all([
      supabaseSelect<
        Array<{ id: string; title: string; last_message_at: string | null }>
      >(
        `chat_sessions?select=id,title,last_message_at&id=eq.${sessionId}&user_id=eq.${userId}&limit=1`,
      ),
      supabaseSelect<
        Array<{
          id: string;
          role: "user" | "assistant" | "system";
          parts: never[];
          created_at: string;
        }>
      >(
        `chat_messages?select=id,role,parts,created_at&session_id=eq.${sessionId}&order=created_at.asc`,
      ),
    ]);

    if (!sessions[0]) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }

    return mobileNoStoreJson({
      session: toChatSession(sessions[0], messages),
    });
  } catch (error) {
    console.error("mobile session detail route error", error);
    return mobileRouteErrorResponse(error, "failed to load session");
  }
}
