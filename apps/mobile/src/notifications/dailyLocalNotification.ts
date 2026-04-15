import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { buildRollingDailyLocalNotificationRequests } from "./dailyLocalNotification.model";

export const DAILY_LOCAL_NOTIFICATION_IDENTIFIER = "patient-daily-tip";

const DAILY_NOTIFICATION_CHANNEL_ID = "daily-tip";
const DAILY_LOCAL_NOTIFICATION_IDENTIFIER_PREFIX = "patient-daily-tip";
const ROLLING_DAILY_LOCAL_NOTIFICATION_DAYS = 14;

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
  const identifiers = [
    DAILY_LOCAL_NOTIFICATION_IDENTIFIER,
    ...Array.from(
      { length: ROLLING_DAILY_LOCAL_NOTIFICATION_DAYS },
      (_, index) => `${DAILY_LOCAL_NOTIFICATION_IDENTIFIER_PREFIX}-${index}`,
    ),
  ];

  await Promise.all(
    identifiers.map(async (identifier) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      } catch {
        // The identifier may not exist yet. In that case there is nothing to cancel.
      }
    }),
  );
}

export async function scheduleDailyLocalNotification(input: {
  notificationTime?: string | null;
  pregnancyWeekLabel?: string | null;
  pregnancyDayCount?: number | null;
}) {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return { scheduled: false, reason: "permission-denied" as const };
  }

  await ensureDailyNotificationChannel();
  await cancelDailyLocalNotification();

  const requests = buildRollingDailyLocalNotificationRequests({
    notificationTime: input.notificationTime,
    pregnancyWeekLabel: input.pregnancyWeekLabel,
    pregnancyDayCount: input.pregnancyDayCount,
    days: ROLLING_DAILY_LOCAL_NOTIFICATION_DAYS,
  });

  for (const request of requests) {
    await Notifications.scheduleNotificationAsync({
      identifier: request.identifier,
      content: {
        title: request.title,
        body: request.body,
        sound: "default",
        data: request.data,
      },
      trigger:
        Platform.OS === "android"
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: request.date,
              channelId: DAILY_NOTIFICATION_CHANNEL_ID,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: request.date,
            },
    });
  }

  return { scheduled: true as const };
}
