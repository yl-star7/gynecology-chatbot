import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
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
        console.error(`Failed to get push token: ${error instanceof Error ? error.message : String(error)}`);
    }

    return token;
}

function handleNotificationResponse(data: Record<string, unknown>) {
    if (typeof data.url === "string" && data.url) {
        void Linking.openURL(data.url);
        return;
    }

    if (typeof data.path === "string" && data.path) {
        void Linking.openURL(`gynecology-chatbot://${String(data.path).replace(/^\//, "")}`);
        return;
    }

    switch (data.type) {
        case "proactive_session":
            if (data.sessionId) {
                void Linking.openURL(`gynecology-chatbot://chat/${String(data.sessionId)}`);
            }
            break;
        case "survey_reminder":
            if (data.surveyId) {
                void Linking.openURL(`gynecology-chatbot://surveys/${String(data.surveyId)}`);
            }
            break;
        default:
            console.log("Unknown notification type:", data.type);
    }
}
