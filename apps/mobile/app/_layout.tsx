// @ts-nocheck
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import {
  HIDDEN_HEADER_SCREEN_OPTIONS,
  ROOT_STACK_ROUTE_NAMES,
} from "./routeOptions.model";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
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
import { MobileUpdateReloader } from "../src/components/MobileUpdateReloader";
import { PushTokenRegistrar } from "../src/components/PushTokenRegistrar";
import {
  preloadPatientAppData,
  resolveUnauthenticatedRedirect,
} from "../src/core/mobileBootstrap.model";
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
import { patientSurfacePalette as surface, space } from "../src/theme";
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
    </View>
  );
}

function BootstrapGate({ children }: { children: React.ReactNode }) {
  const { currentUser, isRestoringSession } = useMobileAppSession();
  const services = useMobileServices();
  const { applyThemeKey, restoreThemeKeyForUser } = useMobileTheme();
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isRestoringSession || !rootNavigationState?.key) {
      return;
    }

    const redirectHref = resolveUnauthenticatedRedirect({
      currentUser,
      isRestoringSession,
      routeSegments: segments,
    });
    if (redirectHref) {
      router.replace(redirectHref);
    }
  }, [currentUser, isRestoringSession, rootNavigationState?.key, router, segments]);

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
              <MobileUpdateReloader />
              {!__DEV__ ? <DailyLocalNotificationRegistrar /> : null}
              {!__DEV__ ? <PushTokenRegistrar /> : null}
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
});
