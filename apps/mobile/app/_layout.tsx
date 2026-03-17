// @ts-nocheck
import { Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { ChatSessionsProvider } from "../src/chat/store";
import { MobileAppSessionProvider } from "../src/core/MobileAppSessionProvider";
import { MobileServicesProvider } from "../src/core/MobileServicesProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (expoPushToken) {
      registerPushToken(expoPushToken);
    }
  }, [expoPushToken]);

  return (
    <SafeAreaProvider>
      <MobileServicesProvider>
        <MobileAppSessionProvider>
          <ChatSessionsProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/set-password" />
              <Stack.Screen name="auth/reset-password" />
              <Stack.Screen name="onboarding/index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="chat/[sessionId]" />
              <Stack.Screen name="chat/link/[target]" />
            </Stack>
          </ChatSessionsProvider>
        </MobileAppSessionProvider>
      </MobileServicesProvider>
    </SafeAreaProvider>
  );
}

async function registerPushToken(token: string) {
  try {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return;
    }

    await fetch(`${apiBaseUrl}/api/push/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pushToken: token }),
    });
  } catch (error) {
    console.error(`Failed to register push token: ${error instanceof Error ? error.message : String(error)}`);
  }
}
