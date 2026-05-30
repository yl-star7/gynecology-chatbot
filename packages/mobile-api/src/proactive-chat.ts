import { createKoreanDateKey } from "@gynecology-chatbot/app-core/time";
import Expo from "expo-server-sdk";
import { dbInsert, dbSelect } from "./db/admin-client";
import { generateGoogleText } from "./text-generation";

const expo = new Expo();

function getGoogleApiKey() {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for proactive chat");
  }

  return apiKey;
}

type PushTargetRow = {
  user_id: string;
  push_token: string;
  pregnancy_week: number | null;
  display_name: string | null;
};

type ChatSessionRow = {
  user_id: string;
  last_message_at: string | null;
};

export async function runProactiveChatForEligibleUsers(): Promise<{
  scheduled: number;
  errors: string[];
}> {
  const targets = (
    await dbSelect<PushTargetRow[]>(
      "pregnancy_profiles?select=user_id,push_token,pregnancy_week,display_name&push_token=not.is.null&notification_enabled=eq.true",
    )
  ).filter(
    (target): target is PushTargetRow => typeof target.push_token === "string",
  );

  if (targets.length === 0) {
    return { scheduled: 0, errors: [] };
  }

  // 2. Filter users who haven't chatted in 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const eligibleUserIds = targets.map((t) => t.user_id);

  // Fetch the most recent session per user to check last_message_at
  const recentSessions = eligibleUserIds.length
    ? (
        await dbSelect<ChatSessionRow[]>(
          `chat_sessions?select=user_id,last_message_at&user_id=in.(${eligibleUserIds.join(",")})&last_message_at=gte.${twentyFourHoursAgo.toISOString()}`,
        )
      ).map(
        (session): ChatSessionRow => ({
          user_id: session.user_id,
          last_message_at: session.last_message_at,
        }),
      )
    : [];

  const activeUserIds = new Set(recentSessions.map((s) => s.user_id));

  const eligibleTargets = targets.filter(
    (t) =>
      !activeUserIds.has(t.user_id) &&
      t.pregnancy_week !== null &&
      Expo.isExpoPushToken(t.push_token),
  );

  let scheduled = 0;
  const errors: string[] = [];

  for (const target of eligibleTargets) {
    try {
      const pregnancyWeek = target.pregnancy_week!;

      // 3. Generate personalized message via Gemini
      const text = await generateGoogleText({
        apiKey: getGoogleApiKey(),
        model: "gemini-3.1-flash-lite",
        prompt: [
          `당신은 임산부 돌봄 어시스턴트입니다.`,
          `사용자의 임신 ${pregnancyWeek}주차에 맞는 짧은 안부 메시지를 한국어로 작성하세요.`,
          `50자 이내로, 따뜻하고 격려하는 톤으로 작성하세요.`,
        ].join("\n"),
      });
      const messageContent = text.trim();

      // 4. Create a proactive session for this user (needed for calendar_logs FK)
      const now = new Date();
      const insertedSession = (
        await dbInsert<Array<{ id: string }>>("chat_sessions", {
          user_id: target.user_id,
          title: "일일 안부",
          status: "active",
          last_message_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
      )[0];
      const sessionId = insertedSession?.id;

      if (!sessionId) {
        throw new Error("Failed to create proactive session");
      }

      // 5. Store a calendar_logs record with entry_type "ai_summary"
      const today = createKoreanDateKey();
      await dbInsert("calendar_logs", {
          user_id: target.user_id,
          session_id: sessionId,
          date: today,
          entry_type: "ai_summary",
          title: "일일 안부 메시지",
          summary: messageContent,
          payload: {
            source: "proactive_chat",
            pregnancyWeek,
          },
      });

      // 6. Send push notification via Expo SDK
      await expo.sendPushNotificationsAsync([
        {
          to: target.push_token,
          sound: "default",
          title: target.display_name
            ? `${target.display_name}님, 안녕하세요`
            : "안녕하세요",
          body: messageContent.substring(0, 100),
          data: { type: "proactive_conversation" },
        },
      ]);

      scheduled++;
    } catch (err) {
      errors.push(
        `User ${target.user_id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { scheduled, errors };
}
