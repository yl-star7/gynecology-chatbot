import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Configure notification handling
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export interface PushNotificationState {
    expoPushToken?: string;
    notification?: Notifications.Notification;
}

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();
    const notificationListener = useRef<Notifications.EventSubscription>();
    const responseListener = useRef<Notifications.EventSubscription>();

    useEffect(() => {
        registerForPushNotificationsAsync().then((token) => {
            setExpoPushToken(token);
        });

        // Listen for incoming notifications while app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                setNotification(notification);
            }
        );

        // Listen for user interactions with notifications
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;
                handleNotificationResponse(data);
            }
        );

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    return {
        expoPushToken,
        notification,
    };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    // Check if physical device
    if (!Device.isDevice) {
        console.log("Push notifications require a physical device");
        return undefined;
    }

    // Set up Android notification channel
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#f28b5c",
        });
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("Push notification permission not granted");
        return undefined;
    }

    // Get Expo push token
    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("Expo push token:", token);
    } catch (error) {
        console.error("Failed to get push token:", error);
    }

    return token;
}

function handleNotificationResponse(data: Record<string, unknown>) {
    // Handle notification tap based on type
    switch (data.type) {
        case "proactive_conversation":
            // Navigate to chat
            if (data.conversationId) {
                // Will be handled by WebView navigation
                console.log("Navigate to conversation:", data.conversationId);
            }
            break;
        case "survey_reminder":
            // Navigate to survey
            if (data.surveyId) {
                console.log("Navigate to survey:", data.surveyId);
            }
            break;
        default:
            console.log("Unknown notification type:", data.type);
    }
}
