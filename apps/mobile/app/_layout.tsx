// @ts-nocheck
import { Stack } from "expo-router";
import {
  HIDDEN_HEADER_SCREEN_OPTIONS,
  ROOT_STACK_ROUTE_NAMES,
} from "./routeOptions.model";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ChatSessionsProvider } from "../src/chat/store";
import {
  MobileAppSessionProvider,
  useMobileAppSession,
} from "../src/core/MobileAppSessionProvider";
import {
  MobileServicesProvider,
  useMobileServices,
} from "../src/core/MobileServicesProvider";
import { DailyLocalNotificationRegistrar } from "../src/components/DailyLocalNotificationRegistrar";
import { PushTokenRegistrar } from "../src/components/PushTokenRegistrar";
import { preloadPatientAppData } from "../src/core/mobileBootstrap.model";

SplashScreen.preventAutoHideAsync();

function SessionScopedStack() {
  const { currentUser } = useMobileAppSession();

  return (
    <ChatSessionsProvider
      key={currentUser?.id ?? "guest"}
      userId={currentUser?.id}
    >
      <StatusBar style="dark" />
      <Stack>
        {ROOT_STACK_ROUTE_NAMES.map((routeName) => (
          <Stack.Screen
            key={routeName}
            name={routeName}
            options={HIDDEN_HEADER_SCREEN_OPTIONS}
          />
        ))}
      </Stack>
    </ChatSessionsProvider>
  );
}

function BootstrapGate({ children }: { children: React.ReactNode }) {
  const { currentUser, isRestoringSession } = useMobileAppSession();
  const services = useMobileServices();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepareApp() {
      if (isRestoringSession) {
        setIsReady(false);
        return;
      }

      setIsReady(false);
      await preloadPatientAppData({ currentUser, services });

      if (cancelled) {
        return;
      }

      setIsReady(true);
      await SplashScreen.hideAsync().catch(() => undefined);
    }

    void prepareApp();

    return () => {
      cancelled = true;
    };
  }, [currentUser, isRestoringSession, services]);

  if (!isReady) {
    return null;
  }

  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MobileServicesProvider>
        <MobileAppSessionProvider>
          <BootstrapGate>
            <DailyLocalNotificationRegistrar />
            <PushTokenRegistrar />
            <SessionScopedStack />
          </BootstrapGate>
        </MobileAppSessionProvider>
      </MobileServicesProvider>
    </SafeAreaProvider>
  );
}
