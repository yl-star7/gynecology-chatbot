import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import {
  mobileNoStoreJson,
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseInsert, supabaseSelect } from "@/lib/supabase/admin-client";

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

type CalendarLogRow = {
  id: string;
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
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
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

    const sessions = await supabaseSelect<SessionRow[]>(
      `chat_sessions?select=id,title&id=eq.${sessionId}&user_id=eq.${userId}&limit=1`,
    );
    if (!sessions[0]) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }

    const existingSummaries = await supabaseSelect<CalendarLogRow[]>(
      `calendar_logs?select=id&session_id=eq.${sessionId}&entry_type=eq.ai_summary&limit=1`,
    );
    if (existingSummaries[0]) {
      return mobileNoStoreJson({
        summarized: false,
        reason: "already_summarized",
      });
    }

    const messages = await supabaseSelect<MessageRow[]>(
      `chat_messages?select=id,role,plain_text,parts,created_at&session_id=eq.${sessionId}&order=created_at.asc`,
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

    await supabaseInsert("calendar_logs", {
      user_id: userId,
      session_id: sessionId,
      date: getKstDateKey(),
      entry_type: "ai_summary",
      title: sessions[0].title || "대화 요약",
      summary: summaryText,
      payload: {
        source: "session_close",
        messageCount: messages.length,
      },
    });

    return mobileNoStoreJson({ summarized: true, summary: summaryText });
  } catch (error) {
    console.error("mobile session summarize route error", error);
    return mobileRouteErrorResponse(error, "failed to summarize session");
  }
}
