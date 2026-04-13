import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/supabase/admin-client";
import { toRecentChats } from "@/lib/mobile/serializers";

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
};

type MessagePreviewRow = {
  session_id: string;
  plain_text: string | null;
  parts: Array<{ type?: string; text?: string }> | null;
};

function resolveMessagePreview(message: MessagePreviewRow) {
  const plainText = message.plain_text?.replace(/\s+/g, " ").trim();
  if (plainText) {
    return plainText;
  }

  const partsText = (message.parts ?? [])
    .flatMap((part) =>
      part.type === "text" && typeof part.text === "string" ? [part.text] : [],
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return partsText || null;
}

export async function GET(request: NextRequest) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);

    const sessions = await supabaseSelect<SessionRow[]>(
      `chat_sessions?select=id,title,last_message_at&user_id=eq.${userId}&order=last_message_at.desc.nullslast`,
    );

    const sessionIds = sessions.map((session) => session.id);
    const latestMessages =
      sessionIds.length > 0
        ? await supabaseSelect<MessagePreviewRow[]>(
            `chat_messages?select=session_id,plain_text,parts&user_id=eq.${userId}&session_id=in.(${sessionIds.join(",")})&order=created_at.desc`,
          )
        : [];

    const previewBySessionId = new Map<string, string>();
    for (const message of latestMessages) {
      if (previewBySessionId.has(message.session_id)) {
        continue;
      }

      const preview = resolveMessagePreview(message);
      if (preview) {
        previewBySessionId.set(message.session_id, preview);
      }
    }

    return NextResponse.json({
      sessions: toRecentChats(
        sessions.map((session) => ({
          ...session,
          last_message_preview: previewBySessionId.get(session.id) ?? null,
        })),
      ),
    });
  } catch (error) {
    console.error("mobile sessions route error", error);
    return mobileRouteErrorResponse(error, "failed to load sessions");
  }
}
