import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import Expo from "expo-server-sdk";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

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

type InsertedSessionRow = {
  id: string;
};

export async function runProactiveChatForEligibleUsers(): Promise<{
  scheduled: number;
  errors: string[];
}> {
  const client = getSupabaseAdminClient();
  // 1. Query users with push enabled
  const { data: targets, error: targetError } = await client
    .from("pregnancy_profiles")
    .select("user_id,push_token,pregnancy_week,display_name")
    .not("push_token", "is", null)
    .eq("notification_enabled", true);
  if (targetError) {
    throw targetError;
  }

  if (targets.length === 0) {
    return { scheduled: 0, errors: [] };
  }

  // 2. Filter users who haven't chatted in 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const eligibleUserIds = targets.map((t) => t.user_id);

  // Fetch the most recent session per user to check last_message_at
  const { data: recentSessions, error: sessionError } = await client
    .from("chat_sessions")
    .select("user_id,last_message_at")
    .in("user_id", eligibleUserIds)
    .gte("last_message_at", twentyFourHoursAgo.toISOString());
  if (sessionError) {
    throw sessionError;
  }

  const activeUserIds = new Set(recentSessions.map((s) => s.user_id));

  const eligibleTargets = targets.filter(
    (t) =>
      !activeUserIds.has(t.user_id) &&
      t.pregnancy_week !== null &&
      Expo.isExpoPushToken(t.push_token),
  );

  const google = createGoogleGenerativeAI({
    apiKey: getGoogleApiKey(),
  });

  let scheduled = 0;
  const errors: string[] = [];

  for (const target of eligibleTargets) {
    try {
      const pregnancyWeek = target.pregnancy_week!;

      // 3. Generate personalized message via Gemini
      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        prompt: [
          `당신은 임산부 돌봄 어시스턴트입니다.`,
          `사용자의 임신 ${pregnancyWeek}주차에 맞는 짧은 안부 메시지를 한국어로 작성하세요.`,
          `50자 이내로, 따뜻하고 격려하는 톤으로 작성하세요.`,
        ].join("\n"),
      });
      const messageContent = text.trim();

      // 4. Create a proactive session for this user (needed for calendar_logs FK)
      const now = new Date().toISOString();
      const { data: insertedSessions, error: insertSessionError } = await client
        .from("chat_sessions")
        .insert({
          user_id: target.user_id,
          title: "일일 안부",
          status: "active",
          last_message_at: now,
          updated_at: now,
        })
        .select("id");
      if (insertSessionError) {
        throw insertSessionError;
      }
      const sessionId = insertedSessions[0]?.id;

      if (!sessionId) {
        throw new Error("Failed to create proactive session");
      }

      // 5. Store a calendar_logs record with entry_type "ai_summary"
      const today = new Date().toISOString().slice(0, 10);
      const { error: logError } = await client.from("calendar_logs").insert({
        user_id: target.user_id,
        session_id: sessionId,
        date: today,
        entry_type: "ai_summary",
        title: "일일 안부 메시지",
        summary: messageContent,
        payload: { source: "proactive_chat", pregnancyWeek },
      });
      if (logError) {
        throw logError;
      }

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
