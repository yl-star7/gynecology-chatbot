import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useMobileAppSession } from "../core/MobileAppSessionProvider";
import { useMobileServices } from "../core/MobileServicesProvider";
import { syncDailyLocalNotificationSchedule } from "../notifications/dailyLocalNotification.model";
import {
  cancelDailyLocalNotification,
  scheduleDailyLocalNotification,
} from "../notifications/dailyLocalNotification";

export function DailyLocalNotificationRegistrar() {
  const { currentUser } = useMobileAppSession();
  const { profilePort } = useMobileServices();
  const scheduledKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!currentUser) {
      scheduledKeyRef.current = null;
      void cancelDailyLocalNotification();
      return;
    }

    async function scheduleFromProfile() {
      try {
        const profile = await profilePort.getProfile();
        if (cancelled) {
          return;
        }

        const result = await syncDailyLocalNotificationSchedule({
          profile: {
            notificationTime: profile.notificationTime,
            pregnancyWeekLabel: profile.pregnancyWeekLabel,
            pregnancyDayCount: profile.pregnancyDayCount,
          },
          previousScheduleKey: scheduledKeyRef.current,
          scheduleLocalNotification: scheduleDailyLocalNotification,
        });
        scheduledKeyRef.current = result.scheduleKey;
      } catch (error) {
        console.error("daily local notification schedule error", error);
      }
    }

    void scheduleFromProfile();
    let lastAppState = AppState.currentState;
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const wasBackgrounded =
        lastAppState === "background" || lastAppState === "inactive";
      if (wasBackgrounded && nextAppState === "active") {
        void scheduleFromProfile();
      }
      lastAppState = nextAppState;
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [currentUser, profilePort]);

  return null;
}
