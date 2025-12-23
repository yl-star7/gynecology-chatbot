/**
 * POST /api/push/send - Send push notification
 * Called by Supabase Edge Functions (pg_cron)
 */

import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/expo-push";

export async function POST(request: NextRequest) {
    try {
        // Verify authorization (from Edge Function)
        const authHeader = request.headers.get("authorization");
        const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!authHeader || !authHeader.includes(expectedKey || "")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { pushToken, title, body, data } = await request.json();

        if (!pushToken || !title || !body) {
            return NextResponse.json(
                { error: "pushToken, title, and body are required" },
                { status: 400 }
            );
        }

        const result = await sendPushNotification(pushToken, title, body, data);

        return NextResponse.json({
            success: result.success,
            ticket: result.ticket,
            error: result.error,
        });
    } catch (error) {
        console.error("Push send error:", error);
        return NextResponse.json(
            { error: "Failed to send push notification" },
            { status: 500 }
        );
    }
}
