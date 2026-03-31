import Expo from "expo-server-sdk";
import { supabaseSelect } from "@/lib/supabase/admin-client";
import { decryptPhoneNumber } from "@/lib/privacy/phone-crypto";
import { sendSmsMessage } from "./twilio-verify";

const expo = new Expo();

type PushTargetRow = {
  user_id: string;
  push_token: string | null;
  pregnancy_week: number | null;
  display_name: string | null;
  notification_time: string | null;
};

type SmsUserRow = {
  id: string;
  phone_number_encrypted: string;
};

export async function sendDailyPushNotifications() {
  // 1. Query notification-enabled targets.
  const targets = await supabaseSelect<PushTargetRow[]>(
    `pregnancy_profiles?select=user_id,push_token,pregnancy_week,display_name,notification_time&notification_enabled=eq.true`,
  );

  if (targets.length === 0) return { sent: 0 };

  // 2. Build push messages for users with valid push tokens.
  const pushTargets = targets.filter(
    (target) => target.push_token && Expo.isExpoPushToken(target.push_token),
  );
  const messages = pushTargets
    .map((target) => ({
      to: target.push_token!,
      sound: "default" as const,
      title: target.display_name
        ? `${target.display_name}님, 오늘도 좋은 하루 보내세요`
        : "오늘도 좋은 하루 보내세요",
      body: target.pregnancy_week
        ? `임신 ${target.pregnancy_week}주차 오늘의 정보가 준비됐어요.`
        : "오늘의 임신 정보를 확인해보세요.",
      data: { type: "daily_tip", pregnancyWeek: target.pregnancy_week },
    }));

  // 3. Send push notifications in chunks.
  const chunks = expo.chunkPushNotifications(messages);
  let pushSent = 0;
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
      pushSent += chunk.length;
    } catch (error) {
      console.error("Push notification chunk failed:", error);
    }
  }

  // 4. Fallback to SMS for users without push tokens.
  const smsTargets = targets.filter((target) => !target.push_token);
  let smsSent = 0;
  let smsMocked = 0;
  if (smsTargets.length > 0) {
    const userIds = smsTargets.map((target) => target.user_id);
    const userRows = await supabaseSelect<SmsUserRow[]>(
      `users?select=id,phone_number_encrypted&id=in.(${userIds.join(",")})`,
    );
    const phoneNumberByUserId = new Map(
      userRows.map((row) => [row.id, decryptPhoneNumber(row.phone_number_encrypted)]),
    );

    for (const target of smsTargets) {
      const phoneNumber = phoneNumberByUserId.get(target.user_id);
      if (!phoneNumber) {
        continue;
      }

      try {
        const body = target.pregnancy_week
          ? `임신 ${target.pregnancy_week}주차 오늘의 정보가 준비됐어요. 앱에서 확인해주세요.`
          : "오늘의 임신 정보를 확인해보세요.";
        const smsResult = await sendSmsMessage(phoneNumber, body);
        if (smsResult.sid.startsWith("mock-")) {
          smsMocked += 1;
        } else {
          smsSent += 1;
        }
      } catch (error) {
        console.error("SMS notification failed:", error);
      }
    }
  }

  return {
    sent: pushSent + smsSent,
    total: messages.length + smsTargets.length,
    pushSent,
    smsSent,
    smsMocked,
  };
}
