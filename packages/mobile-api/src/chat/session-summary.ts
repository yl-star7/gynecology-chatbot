import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  addCalendarDays,
  createKoreanDateKey,
  createKoreanDateTime,
} from "@gynecology-chatbot/app-core/time";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { generateText } from "ai";

type MessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  plain_text: string | null;
  parts: Prisma.JsonValue | null;
  created_at: Date;
};

type SessionRow = {
  id: string;
  title: string;
  last_message_at: Date | null;
};

type ExistingSummaryRow = {
  id: string;
  payload: Prisma.JsonValue | null;
};

type ActivityRow = {
  user_id: string | null;
  session_id: string | null;
};

type SessionSummarySkipReason =
  | "already_summarized"
  | "empty_summary"
  | "not_enough_turns"
  | "same_day_deferred";

type SessionSummaryResult =
  | { summarized: true; summary: string }
  | {
      summarized: false;
      reason: SessionSummarySkipReason;
    };

type SessionSummarySource = "session_close" | "midnight_cron";

type BulkSessionSummaryResult = {
  targetDate: string;
  consideredSessions: number;
  summarizedSessions: number;
  skippedSessions: Record<SessionSummarySkipReason, number>;
  errors: Array<{ sessionId: string; message: string }>;
};
const BULK_SUMMARY_CONCURRENCY = 10;

type SessionSummaryPrisma = {
  chat_sessions: {
    findFirst(args: unknown): Promise<SessionRow | null>;
  };
  calendar_logs: {
    findFirst(args: unknown): Promise<ExistingSummaryRow | null>;
    create(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
  };
  chat_messages: {
    findMany(args: unknown): Promise<MessageRow[]>;
  };
  v_chat_session_activity_dates: {
    findMany(args: unknown): Promise<ActivityRow[]>;
  };
};

const summaryPrisma = prisma as unknown as SessionSummaryPrisma;

export class MobileChatSessionNotFoundError extends Error {
  constructor() {
    super("session not found");
    this.name = "MobileChatSessionNotFoundError";
  }
}

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

function getKstYesterday() {
  return addCalendarDays(getKstDateKey(), -1);
}

function parseDateOnly(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function assertIsoDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new Error(`invalid ISO date key: ${value}`);
  }
}

function asObject<T>(value: Prisma.JsonValue | null | undefined): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
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
  return (asMessageParts(message.parts) ?? [])
    .flatMap((part) =>
      part.type === "text" && typeof part.text === "string" ? [part.text] : [],
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDialogueLines(messages: MessageRow[]) {
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

  return { dialogueLines, userTurnCount };
}

export async function summarizeMobileChatSession(input: {
  userId: string;
  sessionId: string;
  summaryDate?: string;
  messageDate?: string;
  source?: SessionSummarySource;
  allowSameDay?: boolean;
  skipIfSummaryExists?: boolean;
}): Promise<SessionSummaryResult> {
  const summaryDate = input.summaryDate ?? getKstDateKey();
  assertIsoDateKey(summaryDate);
  if (input.messageDate) {
    assertIsoDateKey(input.messageDate);
  }

  const session = await summaryPrisma.chat_sessions.findFirst({
    where: {
      id: input.sessionId,
      user_id: input.userId,
    },
    select: {
      id: true,
      title: true,
      last_message_at: true,
    },
  });
  if (!session) {
    throw new MobileChatSessionNotFoundError();
  }

  if (
    !input.allowSameDay &&
    session.last_message_at &&
    createKoreanDateKey(session.last_message_at) === getKstDateKey()
  ) {
    return {
      summarized: false,
      reason: "same_day_deferred",
    };
  }

  const messageDateRange = input.messageDate
    ? {
        gte: createKoreanDateTime({ isoDate: input.messageDate }),
        lt: createKoreanDateTime({
          isoDate: addCalendarDays(input.messageDate, 1),
        }),
      }
    : undefined;
  const scopedSummaryDate =
    input.source === "midnight_cron" || input.messageDate
      ? parseDateOnly(summaryDate)
      : undefined;

  const [existingSummary, messages] = await Promise.all([
    summaryPrisma.calendar_logs.findFirst({
      where: {
        session_id: input.sessionId,
        entry_type: "ai_summary",
        ...(scopedSummaryDate ? { date: scopedSummaryDate } : {}),
      },
      orderBy: { created_at: "desc" },
      select: { id: true, payload: true },
    }),
    summaryPrisma.chat_messages.findMany({
      where: {
        session_id: input.sessionId,
        ...(messageDateRange ? { created_at: messageDateRange } : {}),
      },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        role: true,
        plain_text: true,
        parts: true,
        created_at: true,
      },
    }),
  ]);

  const existingPayload = asObject<{ messageCount?: number }>(
    existingSummary?.payload,
  );
  if (existingSummary?.id && input.skipIfSummaryExists) {
    return {
      summarized: false,
      reason: "already_summarized",
    };
  }

  if (
    existingSummary?.id &&
    typeof existingPayload?.messageCount === "number" &&
    existingPayload.messageCount >= messages.length
  ) {
    return {
      summarized: false,
      reason: "already_summarized",
    };
  }

  const { dialogueLines, userTurnCount } = buildDialogueLines(
    messages.map(
      (message): MessageRow => ({
        id: message.id,
        role: message.role as MessageRow["role"],
        plain_text: message.plain_text,
        parts: message.parts,
        created_at: message.created_at,
      }),
    ),
  );

  if (userTurnCount < 1 || dialogueLines.length < 2) {
    return {
      summarized: false,
      reason: "not_enough_turns",
    };
  }

  const google = createGoogleGenerativeAI({ apiKey: getGoogleApiKey() })(
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
    return { summarized: false, reason: "empty_summary" };
  }

  const payload = {
    source: input.source ?? "session_close",
    messageCount: messages.length,
    generatedAt: new Date().toISOString(),
  } as Prisma.InputJsonValue;

  if (existingSummary?.id) {
    await summaryPrisma.calendar_logs.update({
      where: { id: existingSummary.id },
      data: {
        title:
          input.source === "midnight_cron"
            ? "채팅"
            : session.title || "대화 요약",
        summary: summaryText,
        payload,
      },
    });
  } else {
    await summaryPrisma.calendar_logs.create({
      data: {
        user_id: input.userId,
        session_id: input.sessionId,
        date: parseDateOnly(summaryDate),
        entry_type: "ai_summary",
        title:
          input.source === "midnight_cron"
            ? "채팅"
            : session.title || "대화 요약",
        summary: summaryText,
        payload,
      },
    });
  }

  return { summarized: true, summary: summaryText };
}

export async function summarizeUnsummarizedMobileChatSessions(
  input: {
    targetDate?: string;
    limit?: number;
  } = {},
): Promise<BulkSessionSummaryResult> {
  const targetDate = input.targetDate ?? getKstYesterday();
  assertIsoDateKey(targetDate);

  const limit =
    typeof input.limit === "number" && Number.isFinite(input.limit)
      ? Math.max(1, Math.min(input.limit, 500))
      : undefined;
  const activityRows =
    await summaryPrisma.v_chat_session_activity_dates.findMany({
      where: {
        activity_date: parseDateOnly(targetDate),
      },
      orderBy: [{ last_message_at: "asc" }],
      ...(limit ? { take: limit } : {}),
      select: {
        user_id: true,
        session_id: true,
      },
    });

  const sessionCandidates = new Map<string, { userId: string }>();
  for (const row of activityRows) {
    if (
      !row.session_id ||
      !row.user_id ||
      sessionCandidates.has(row.session_id)
    ) {
      continue;
    }
    sessionCandidates.set(row.session_id, { userId: row.user_id });
  }

  const skippedSessions: BulkSessionSummaryResult["skippedSessions"] = {
    already_summarized: 0,
    empty_summary: 0,
    not_enough_turns: 0,
    same_day_deferred: 0,
  };
  const errors: BulkSessionSummaryResult["errors"] = [];
  let summarizedSessions = 0;

  const sessionQueue = Array.from(sessionCandidates.entries());
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < sessionQueue.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      const [sessionId, candidate] = sessionQueue[currentIndex];
      if (!sessionId || !candidate) {
        continue;
      }

      try {
        const result = await summarizeMobileChatSession({
          userId: candidate.userId,
          sessionId,
          summaryDate: targetDate,
          messageDate: targetDate,
          source: "midnight_cron",
          allowSameDay: true,
          skipIfSummaryExists: true,
        });

        if (result.summarized) {
          summarizedSessions += 1;
        } else {
          skippedSessions[result.reason] += 1;
        }
      } catch (error) {
        errors.push({
          sessionId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const workerCount = Math.min(BULK_SUMMARY_CONCURRENCY, sessionQueue.length);
  if (workerCount > 0) {
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
  }

  return {
    targetDate,
    consideredSessions: sessionCandidates.size,
    summarizedSessions,
    skippedSessions,
    errors,
  };
}
