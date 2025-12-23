import { Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { StatusBar } from "expo-status-bar";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { expoPushToken } = usePushNotifications();

    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    useEffect(() => {
        if (expoPushToken) {
            // Send token to backend when available
            registerPushToken(expoPushToken);
        }
    }, [expoPushToken]);

    return (
        <>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
            </Stack>
        </>
    );
}

async function registerPushToken(token: string) {
    try {
        const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "https://your-app.vercel.app";
        await fetch(`${WEB_URL}/api/push/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pushToken: token }),
            credentials: "include",
        });
    } catch (error) {
        console.error("Failed to register push token:", error);
    }
}
