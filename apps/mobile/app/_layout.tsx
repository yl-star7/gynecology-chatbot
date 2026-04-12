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
import { ChatSessionsProvider } from "../src/chat/store";
import { MobileAppSessionProvider } from "../src/core/MobileAppSessionProvider";
import { MobileServicesProvider } from "../src/core/MobileServicesProvider";
import { PushTokenRegistrar } from "../src/components/PushTokenRegistrar";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <MobileServicesProvider>
        <MobileAppSessionProvider>
          <PushTokenRegistrar />
          <ChatSessionsProvider>
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
        </MobileAppSessionProvider>
      </MobileServicesProvider>
    </SafeAreaProvider>
  );
}
