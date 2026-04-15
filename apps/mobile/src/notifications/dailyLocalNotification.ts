import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { buildDailyLocalNotificationRequest } from "./dailyLocalNotification.model";

export const DAILY_LOCAL_NOTIFICATION_IDENTIFIER = "patient-daily-tip";

const DAILY_NOTIFICATION_CHANNEL_ID = "daily-tip";

async function ensureNotificationPermission() {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

async function ensureDailyNotificationChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(DAILY_NOTIFICATION_CHANNEL_ID, {
    name: "오늘의 임신 정보",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#f28b5c",
  });
}

export async function cancelDailyLocalNotification() {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      DAILY_LOCAL_NOTIFICATION_IDENTIFIER,
    );
  } catch {
    // The identifier may not exist yet. In that case there is nothing to cancel.
  }
}

export async function scheduleDailyLocalNotification(input: {
  notificationTime?: string | null;
  pregnancyWeekLabel?: string | null;
}) {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return { scheduled: false, reason: "permission-denied" as const };
  }

  await ensureDailyNotificationChannel();
  await cancelDailyLocalNotification();

  const request = buildDailyLocalNotificationRequest(input);
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_LOCAL_NOTIFICATION_IDENTIFIER,
    content: {
      title: request.title,
      body: request.body,
      sound: "default",
      data: request.data,
    },
    trigger:
      Platform.OS === "android"
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: request.trigger.hour,
            minute: request.trigger.minute,
            channelId: DAILY_NOTIFICATION_CHANNEL_ID,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: request.trigger.hour,
            minute: request.trigger.minute,
          },
  });

  return { scheduled: true as const };
}
