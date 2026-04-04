// @ts-nocheck
import { Stack } from "expo-router";
import { HIDDEN_HEADER_SCREEN_OPTIONS } from "./routeOptions.model";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ChatSessionsProvider } from "../src/chat/store";
import { MobileAppSessionProvider } from "../src/core/MobileAppSessionProvider";
import { MobileServicesProvider } from "../src/core/MobileServicesProvider";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { readCurrentMobileSessionToken } from "../src/api/mobileApi";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (!expoPushToken) return;

    const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
    const sessionToken = readCurrentMobileSessionToken();

    fetch(`${apiBaseUrl}/api/push/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify({ pushToken: expoPushToken }),
    }).catch((error) => {
      console.error("Failed to register push token:", error);
    });
  }, [expoPushToken]);

  return (
    <SafeAreaProvider>
      <MobileServicesProvider>
        <MobileAppSessionProvider>
          <ChatSessionsProvider>
            <StatusBar style="dark" />
            <Stack>
              <Stack.Screen name="index" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
              <Stack.Screen name="auth/login" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
              <Stack.Screen name="onboarding/index" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
              <Stack.Screen name="(tabs)" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
              <Stack.Screen name="chat/[sessionId]" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
              <Stack.Screen name="chat/link/[target]" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
              <Stack.Screen name="records/[isoDate]" options={HIDDEN_HEADER_SCREEN_OPTIONS} />
            </Stack>
          </ChatSessionsProvider>
        </MobileAppSessionProvider>
      </MobileServicesProvider>
    </SafeAreaProvider>
  );
}
