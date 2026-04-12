import { useEffect, useRef } from "react";
import { useMobileAppSession } from "../core/MobileAppSessionProvider";
import { readCurrentMobileSessionToken } from "../api/mobileApi";
import { usePushNotifications } from "../../hooks/usePushNotifications";

export function PushTokenRegistrar() {
  const { currentUser } = useMobileAppSession();
  const { expoPushToken } = usePushNotifications();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!expoPushToken || !currentUser) return;
    if (registeredRef.current) return;

    const sessionToken = readCurrentMobileSessionToken();
    if (!sessionToken) return;

    const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(
      /\/$/,
      "",
    );

    fetch(`${apiBaseUrl}/api/mobile/push/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ pushToken: expoPushToken }),
    })
      .then((res) => {
        if (res.ok) registeredRef.current = true;
      })
      .catch((error) => {
        console.error("Failed to register push token:", error);
      });
  }, [expoPushToken, currentUser]);

  return null;
}
