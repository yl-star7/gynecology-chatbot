import { NextRequest } from "next/server";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import {
  mobileNoStoreJson,
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import {
  resolveRecentChatPreview,
  toRecentChats,
} from "@/lib/mobile/serializers";

type SessionRow = {
  id: string;
  title: string;
  last_message_at: string | null;
};

type MessagePreviewRow = {
  session_id: string;
  plain_text: string | null;
  parts: Array<{
    type?: string;
    text?: string;
    choices?: unknown[] | null;
  }> | null;
};

type SessionSummaryRow = {
  session_id: string | null;
  summary: string | null;
};

function toIsoString(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function asMessageParts(value: Prisma.JsonValue): MessagePreviewRow["parts"] {
  return Array.isArray(value) ? (value as MessagePreviewRow["parts"]) : null;
}

export async function GET(request: NextRequest) {
  try {
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);

    const sessions = await prisma.chat_sessions.findMany({
      where: { user_id: userId },
      orderBy: [{ last_message_at: "desc" }],
      select: {
        id: true,
        title: true,
        last_message_at: true,
      },
    });

    const sessionIds = sessions.map((session) => session.id);
    const [latestMessages, summaryRows] =
      sessionIds.length > 0
        ? await Promise.all([
            prisma.chat_messages.findMany({
              where: {
                session_id: { in: sessionIds },
              },
              orderBy: [{ created_at: "desc" }],
              select: {
                session_id: true,
                plain_text: true,
                parts: true,
              },
            }),
            prisma.calendar_logs.findMany({
              where: {
                user_id: userId,
                session_id: { in: sessionIds },
                entry_type: "ai_summary",
              },
              orderBy: [{ created_at: "desc" }],
              select: {
                session_id: true,
                summary: true,
              },
            }),
          ])
        : [[], []];

    const summaryBySessionId = new Map<string, string>();
    for (const row of summaryRows as SessionSummaryRow[]) {
      if (!row.session_id || summaryBySessionId.has(row.session_id)) {
        continue;
      }

      const summary = row.summary?.replace(/\s+/g, " ").trim();
      if (summary) {
        summaryBySessionId.set(row.session_id, summary);
      }
    }

    const previewBySessionId = new Map<string, string>();
    for (const message of latestMessages) {
      if (previewBySessionId.has(message.session_id)) {
        continue;
      }

      const preview = resolveRecentChatPreview({
        plainText: message.plain_text,
        parts: asMessageParts(message.parts),
      });
      if (preview) {
        previewBySessionId.set(message.session_id, preview);
      }
    }

    return mobileNoStoreJson({
      sessions: toRecentChats(
        sessions.map((session) => ({
          ...session,
          last_message_at: toIsoString(session.last_message_at),
          last_message_preview:
            summaryBySessionId.get(session.id) ??
            previewBySessionId.get(session.id) ??
            null,
        })),
      ),
    });
  } catch (error) {
    console.error("mobile sessions route error", error);
    return mobileRouteErrorResponse(error, "failed to load sessions");
  }
}
