import Expo from "expo-server-sdk";
import { supabaseSelect } from "./supabase-rest";

const expo = new Expo();

type PushTargetRow = {
  user_id: string;
  push_token: string;
  pregnancy_week: number | null;
  display_name: string | null;
  notification_time: string | null;
};

export async function sendDailyPushNotifications() {
  // 1. Query pregnancy_profiles where push_token is not null AND notification_enabled = true
  const targets = await supabaseSelect<PushTargetRow[]>(
    `pregnancy_profiles?select=user_id,push_token,pregnancy_week,display_name,notification_time&push_token=not.is.null&notification_enabled=eq.true`,
  );

  if (targets.length === 0) return { sent: 0 };

  // 2. Build messages
  const messages = targets
    .filter((t) => Expo.isExpoPushToken(t.push_token))
    .map((target) => ({
      to: target.push_token,
      sound: "default" as const,
      title: target.display_name
        ? `${target.display_name}님, 오늘도 좋은 하루 보내세요`
        : "오늘도 좋은 하루 보내세요",
      body: target.pregnancy_week
        ? `임신 ${target.pregnancy_week}주차 오늘의 정보가 준비됐어요.`
        : "오늘의 임신 정보를 확인해보세요.",
      data: { type: "daily_tip", pregnancyWeek: target.pregnancy_week },
    }));

  // 3. Send in chunks
  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
      sent += chunk.length;
    } catch (error) {
      console.error("Push notification chunk failed:", error);
    }
  }

  return { sent, total: messages.length };
}
