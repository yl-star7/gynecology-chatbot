// @ts-nocheck
import { Stack } from "expo-router";
import {
  HIDDEN_HEADER_SCREEN_OPTIONS,
  ROOT_STACK_ROUTE_NAMES,
} from "./routeOptions.model";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";
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
import {
  hasFreshCachedHomeView,
  hasFreshCachedPregnancyWeeks,
  hasFreshCachedProfileView,
  hasFreshCachedRecentChats,
  hasFreshCachedRecordDayView,
  hasFreshCachedTodayView,
  readCachedProfileView,
} from "../src/core/patientViewCache";
import { BrandMark } from "../src/components/ui";
import { patientSurfacePalette as surface, space, typo } from "../src/theme";
import { MobileThemeProvider, useMobileTheme } from "../src/theme-provider";

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

function BootstrapFallback() {
  return (
    <View style={styles.bootstrapFallback}>
      <BrandMark subtitle="잠깐만 기다려 주세요" centered size={60} />
      <Text style={styles.bootstrapDescription}>
        오늘의 기록을 정리하고 있어요.
      </Text>
    </View>
  );
}

function BootstrapGate({ children }: { children: React.ReactNode }) {
  const { currentUser, isRestoringSession } = useMobileAppSession();
  const services = useMobileServices();
  const { applyThemeKey, restoreThemeKeyForUser } = useMobileTheme();

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }

    void preloadPatientAppData({
      currentUser,
      services,
      cacheState: {
        hasFreshProfileView: hasFreshCachedProfileView,
        hasFreshHomeView: hasFreshCachedHomeView,
        hasFreshTodayView: hasFreshCachedTodayView,
        hasFreshPregnancyWeeks: hasFreshCachedPregnancyWeeks,
        hasFreshRecentChats: hasFreshCachedRecentChats,
        hasFreshRecordDayView: hasFreshCachedRecordDayView,
      },
    });
  }, [currentUser, isRestoringSession, services]);

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }

    if (!currentUser) {
      void applyThemeKey(null);
      return;
    }

    let cancelled = false;
    const cachedProfile = readCachedProfileView(currentUser.id);

    void restoreThemeKeyForUser(currentUser.id, cachedProfile?.themeKey).catch(
      () => undefined,
    );

    if (!cachedProfile?.themeKey) {
      void services.profilePort
        .getProfile()
        .then((profile) => {
          if (!cancelled) {
            void applyThemeKey(profile.themeKey, currentUser.id);
          }
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [
    applyThemeKey,
    currentUser,
    isRestoringSession,
    restoreThemeKeyForUser,
    services.profilePort,
  ]);

  if (isRestoringSession) {
    return <BootstrapFallback />;
  }

  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MobileThemeProvider>
        <MobileServicesProvider>
          <MobileAppSessionProvider>
            <BootstrapGate>
              <DailyLocalNotificationRegistrar />
              <PushTokenRegistrar />
              <SessionScopedStack />
            </BootstrapGate>
          </MobileAppSessionProvider>
        </MobileServicesProvider>
      </MobileThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bootstrapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.pageBackground,
    paddingHorizontal: space.xl,
    gap: space.md,
  },
  bootstrapDescription: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
  },
});
