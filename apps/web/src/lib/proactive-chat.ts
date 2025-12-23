/**
 * Proactive Chat Service
 * Handles scheduling and sending AI-initiated conversations
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateProactiveMessage } from "@/lib/langchain";
import { sendProactiveNotification } from "@/lib/expo-push";
import type { AIPersona } from "@gynecology-chatbot/types";

async function createSupabaseClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );
}

interface ProactiveTarget {
    userId: string;
    pushToken: string;
    pregnancyWeek: number;
    lastInteraction: Date;
    persona: AIPersona;
}

/**
 * Get users eligible for proactive messages
 * - Haven't interacted in 24+ hours
 * - Have push notifications enabled
 * - Are pregnant (have pregnancy_week set)
 */
export async function getProactiveTargets(): Promise<ProactiveTarget[]> {
    const supabase = await createSupabaseClient();

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Get eligible users
    const { data: users, error } = await supabase
        .from("users")
        .select(`
      id,
      push_token,
      push_enabled,
      pregnancy_week,
      ai_persona_id,
      last_login_at
    `)
        .eq("push_enabled", true)
        .not("push_token", "is", null)
        .not("pregnancy_week", "is", null)
        .lt("last_login_at", twentyFourHoursAgo.toISOString());

    if (error || !users) return [];

    // Get personas
    const personaIds = [...new Set(users.map(u => u.ai_persona_id))];
    const { data: personas } = await supabase
        .from("ai_personas")
        .select("*")
        .in("id", personaIds);

    const personaMap = new Map(personas?.map(p => [p.id, p]) || []);

    // Check for existing pending proactive messages today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: sentToday } = await supabase
        .from("proactive_conversations")
        .select("user_id")
        .gte("scheduled_at", today.toISOString())
        .in("status", ["pending", "sent"]);

    const sentTodaySet = new Set(sentToday?.map(s => s.user_id) || []);

    // Filter and map to targets
    return users
        .filter(u => !sentTodaySet.has(u.id))
        .map(u => ({
            userId: u.id,
            pushToken: u.push_token!,
            pregnancyWeek: u.pregnancy_week!,
            lastInteraction: new Date(u.last_login_at || Date.now()),
            persona: personaMap.get(u.ai_persona_id) || personaMap.get("default")!,
        }));
}

/**
 * Schedule proactive message for a user
 */
export async function scheduleProactiveMessage(
    userId: string,
    triggerTypeId: "daily_check" | "weekly_milestone" | "symptom_follow_up" | "checkup_reminder",
    messageContent: string,
    scheduledAt: Date = new Date()
): Promise<string | null> {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
        .from("proactive_conversations")
        .insert({
            user_id: userId,
            trigger_type_id: triggerTypeId,
            scheduled_at: scheduledAt.toISOString(),
            message_content: messageContent,
            status: "pending",
        })
        .select("id")
        .single();

    if (error) {
        console.error("Schedule proactive message error:", error);
        return null;
    }

    return data.id;
}

/**
 * Send pending proactive messages
 * Called by cron job
 */
export async function sendPendingProactiveMessages(): Promise<{
    sent: number;
    failed: number;
}> {
    const supabase = await createSupabaseClient();

    // Get pending messages that are due
    const { data: pending, error } = await supabase
        .from("proactive_conversations")
        .select(`
      id,
      user_id,
      message_content,
      users:user_id(push_token)
    `)
        .eq("status", "pending")
        .lte("scheduled_at", new Date().toISOString());

    if (error || !pending) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    for (const message of pending) {
        const pushToken = (message.users as { push_token?: string })?.push_token;

        if (!pushToken) {
            failed++;
            continue;
        }

        const result = await sendProactiveNotification(
            pushToken,
            message.message_content,
            undefined // Will create new conversation when user responds
        );

        if (result.success) {
            await supabase
                .from("proactive_conversations")
                .update({
                    status: "sent",
                    sent_at: new Date().toISOString(),
                })
                .eq("id", message.id);
            sent++;
        } else {
            failed++;
        }
    }

    return { sent, failed };
}

/**
 * Generate and schedule daily check messages for all eligible users
 */
export async function generateDailyCheckMessages(): Promise<number> {
    const targets = await getProactiveTargets();
    let scheduled = 0;

    for (const target of targets) {
        try {
            const message = await generateProactiveMessage(
                target.persona,
                target.pregnancyWeek,
                target.lastInteraction
            );

            const id = await scheduleProactiveMessage(
                target.userId,
                "daily_check",
                message
            );

            if (id) scheduled++;
        } catch (error) {
            console.error(`Failed to generate proactive message for ${target.userId}:`, error);
        }
    }

    return scheduled;
}
