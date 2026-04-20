import { NextRequest, NextResponse } from "next/server";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

import {
  mobileNoStoreJson,
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { toChatSession } from "@/lib/mobile/serializers";

function toIsoString(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function asParts(value: Prisma.JsonValue) {
  return Array.isArray(value) ? (value as never[]) : [];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { sessionId } = await context.params;
    const { userId } = await requireMobileSession(request, hintedUserId);

    const [session, messages] = await Promise.all([
      prisma.chat_sessions.findFirst({
        where: {
          id: sessionId,
          user_id: userId,
        },
        select: {
          id: true,
          title: true,
          last_message_at: true,
        },
      }),
      prisma.chat_messages.findMany({
        where: { session_id: sessionId },
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          role: true,
          parts: true,
          created_at: true,
        },
      }),
    ]);

    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }

    return mobileNoStoreJson({
      session: toChatSession(
        {
          ...session,
          last_message_at: toIsoString(session.last_message_at),
        },
        messages.map((message) => ({
          id: message.id,
          role: message.role as "user" | "assistant" | "system",
          parts: asParts(message.parts),
          created_at: message.created_at.toISOString(),
        })),
      ),
    });
  } catch (error) {
    console.error("mobile session detail route error", error);
    return mobileRouteErrorResponse(error, "failed to load session");
  }
}
