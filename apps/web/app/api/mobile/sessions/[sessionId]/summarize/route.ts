import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createKoreanDateKey } from "@gynecology-chatbot/app-core/time";
import { generateText } from "ai";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

import {
  mobileNoStoreJson,
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

export const maxDuration = 30;

type MessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  plain_text: string | null;
  parts: Array<{ type?: string; text?: string }> | null;
  created_at: string;
};

type SessionRow = {
  id: string;
  title: string;
};

function getGoogleApiKey() {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for session summarization");
  }
  return apiKey;
}

function getKstDateKey() {
  return createKoreanDateKey();
}

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function asMessageParts(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value)
    ? (value as Array<{ type?: string; text?: string }>)
    : null;
}

function extractMessageText(message: MessageRow): string {
  if (message.plain_text && message.plain_text.trim()) {
    return message.plain_text.trim();
  }
  return (message.parts ?? [])
    .flatMap((part) =>
      part.type === "text" && typeof part.text === "string" ? [part.text] : [],
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const hintedUserId = request.nextUrl.searchParams.get("userId");
    const { userId } = await requireMobileSession(request, hintedUserId);

    const session = await prisma.chat_sessions.findFirst({
      where: {
        id: sessionId,
        user_id: userId,
      },
      select: {
        id: true,
        title: true,
      },
    });
    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }

    const existingSummary = await prisma.calendar_logs.findFirst({
      where: {
        session_id: sessionId,
        entry_type: "ai_summary",
      },
      select: { id: true },
    });
    if (existingSummary?.id) {
      return mobileNoStoreJson({
        summarized: false,
        reason: "already_summarized",
      });
    }

    const messages = (
      await prisma.chat_messages.findMany({
        where: { session_id: sessionId },
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          role: true,
          plain_text: true,
          parts: true,
          created_at: true,
        },
      })
    ).map(
      (message): MessageRow => ({
        id: message.id,
        role: message.role as MessageRow["role"],
        plain_text: message.plain_text,
        parts: asMessageParts(message.parts),
        created_at: message.created_at.toISOString(),
      }),
    );

    const dialogueLines: string[] = [];
    let userTurnCount = 0;
    for (const message of messages) {
      const text = extractMessageText(message);
      if (!text) continue;
      if (message.role === "user") {
        userTurnCount += 1;
        dialogueLines.push(`산모: ${text}`);
      } else if (message.role === "assistant") {
        dialogueLines.push(`아가야: ${text}`);
      }
    }

    if (userTurnCount < 1 || dialogueLines.length < 2) {
      return mobileNoStoreJson({
        summarized: false,
        reason: "not_enough_turns",
      });
    }

    const apiKey = getGoogleApiKey();
    const google = createGoogleGenerativeAI({ apiKey })(
      "gemini-2.5-flash-lite",
    );

    const { text } = await generateText({
      model: google,
      prompt: [
        "아래는 임산부와 아가야(간호사 캐릭터)의 대화예요.",
        "대화 내용을 1~2문장으로 따뜻하게 요약해주세요.",
        "- 산모의 감정이나 주된 고민을 먼저 반영하세요.",
        "- 어시스턴트가 안내한 핵심 정보나 다음 행동을 간결히 담으세요.",
        "- 진단 표현, 의료 단정 표현은 쓰지 마세요.",
        "- '요약:' 같은 머리말 없이 본문만 작성하세요.",
        "- 한국어, -해요/-어요 체.",
        "",
        "대화:",
        dialogueLines.join("\n"),
      ].join("\n"),
    });

    const summaryText = text.trim();
    if (!summaryText) {
      return mobileNoStoreJson({ summarized: false, reason: "empty_summary" });
    }

    await prisma.calendar_logs.create({
      data: {
        user_id: userId,
        session_id: sessionId,
        date: parseDateOnly(getKstDateKey()),
        entry_type: "ai_summary",
        title: session.title || "대화 요약",
        summary: summaryText,
        payload: {
          source: "session_close",
          messageCount: messages.length,
        } as Prisma.InputJsonValue,
      },
    });

    return mobileNoStoreJson({ summarized: true, summary: summaryText });
  } catch (error) {
    console.error("mobile session summarize route error", error);
    return mobileRouteErrorResponse(error, "failed to summarize session");
  }
}
