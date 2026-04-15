import { useEffect, useRef } from "react";
import { useMobileAppSession } from "../core/MobileAppSessionProvider";
import { useMobileServices } from "../core/MobileServicesProvider";
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

        const scheduledKey = [
          profile.notificationTime ?? "",
          profile.pregnancyWeekLabel ?? "",
        ].join(":");
        if (scheduledKeyRef.current === scheduledKey) {
          return;
        }

        await scheduleDailyLocalNotification({
          notificationTime: profile.notificationTime,
          pregnancyWeekLabel: profile.pregnancyWeekLabel,
        });
        scheduledKeyRef.current = scheduledKey;
      } catch (error) {
        console.error("daily local notification schedule error", error);
      }
    }

    void scheduleFromProfile();

    return () => {
      cancelled = true;
    };
  }, [currentUser, profilePort]);

  return null;
}
