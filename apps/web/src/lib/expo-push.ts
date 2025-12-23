/**
 * Expo Push Notification Service
 * Sends push notifications to Expo-based mobile apps
 */

import Expo, { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from "expo-server-sdk";

const expo = new Expo();

interface PushResult {
    success: boolean;
    ticket?: ExpoPushTicket;
    error?: string;
}

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<PushResult> {
    // Validate token
    if (!Expo.isExpoPushToken(pushToken)) {
        return {
            success: false,
            error: "Invalid Expo push token",
        };
    }

    const message: ExpoPushMessage = {
        to: pushToken,
        sound: "default",
        title,
        body,
        data: data || {},
        priority: "high",
        channelId: "default",
    };

    try {
        const tickets = await expo.sendPushNotificationsAsync([message]);
        const ticket = tickets[0];

        if (ticket.status === "error") {
            return {
                success: false,
                ticket,
                error: ticket.message || "Unknown push error",
            };
        }

        return {
            success: true,
            ticket,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Push notification failed",
        };
    }
}

/**
 * Send push notifications to multiple devices
 */
export async function sendBatchPushNotifications(
    notifications: Array<{
        pushToken: string;
        title: string;
        body: string;
        data?: Record<string, unknown>;
    }>
): Promise<Array<PushResult>> {
    const messages: ExpoPushMessage[] = [];
    const results: Array<PushResult> = [];

    // Prepare messages
    for (let i = 0; i < notifications.length; i++) {
        const { pushToken, title, body, data } = notifications[i];

        if (!Expo.isExpoPushToken(pushToken)) {
            results[i] = {
                success: false,
                error: "Invalid Expo push token",
            };
            continue;
        }

        messages.push({
            to: pushToken,
            sound: "default",
            title,
            body,
            data: data || {},
            priority: "high",
            channelId: "default",
        });
    }

    // Send in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            // Mark all in this chunk as failed
            chunk.forEach(() => {
                tickets.push({
                    status: "error",
                    message: error instanceof Error ? error.message : "Batch send failed",
                } as ExpoPushTicket);
            });
        }
    }

    // Map tickets back to results
    let ticketIndex = 0;
    for (let i = 0; i < notifications.length; i++) {
        if (results[i]) continue; // Already marked as invalid token

        const ticket = tickets[ticketIndex++];
        results[i] = {
            success: ticket.status === "ok",
            ticket,
            error: ticket.status === "error" ? ticket.message : undefined,
        };
    }

    return results;
}

/**
 * Check receipt status for sent notifications
 */
export async function checkPushReceipts(
    ticketIds: string[]
): Promise<Record<string, ExpoPushReceipt>> {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
    const allReceipts: Record<string, ExpoPushReceipt> = {};

    for (const chunk of receiptIdChunks) {
        try {
            const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
            Object.assign(allReceipts, receipts);
        } catch (error) {
            console.error("Error checking receipts:", error);
        }
    }

    return allReceipts;
}

/**
 * Send proactive conversation notification
 */
export async function sendProactiveNotification(
    pushToken: string,
    message: string,
    conversationId?: string
): Promise<PushResult> {
    return sendPushNotification(
        pushToken,
        "👩‍⚕️ 오늘 하루 어떠셨나요?",
        message,
        {
            type: "proactive_conversation",
            conversationId,
        }
    );
}

/**
 * Send survey reminder notification
 */
export async function sendSurveyReminder(
    pushToken: string,
    surveyTitle: string,
    surveyId: string
): Promise<PushResult> {
    return sendPushNotification(
        pushToken,
        "📋 설문이 도착했어요",
        `${surveyTitle} 설문에 참여해주세요`,
        {
            type: "survey_reminder",
            surveyId,
        }
    );
}
