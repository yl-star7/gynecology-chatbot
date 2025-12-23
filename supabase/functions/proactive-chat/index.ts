// Supabase Edge Function: proactive-chat
// Triggered by pg_cron to generate and send proactive messages

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TriggerType {
    id: string;
    name: string;
    message_template: string;
    is_active: boolean;
}

interface User {
    id: string;
    push_token: string;
    pregnancy_week: number;
    ai_persona_id: string;
    last_login_at: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;
        const webAppUrl = Deno.env.get("WEB_APP_URL") || "https://your-app.vercel.app";

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get trigger type from request or default to daily_check
        const { triggerId = "daily_check" } = await req.json().catch(() => ({}));

        // Get trigger type info
        const { data: trigger, error: triggerError } = await supabase
            .from("proactive_trigger_types")
            .select("*")
            .eq("id", triggerId)
            .eq("is_active", true)
            .single();

        if (triggerError || !trigger) {
            return new Response(
                JSON.stringify({ error: "Trigger type not found or inactive" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get eligible users (haven't interacted in 24h, have push enabled)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { data: users, error: usersError } = await supabase
            .from("users")
            .select("id, push_token, pregnancy_week, ai_persona_id, last_login_at")
            .eq("push_enabled", true)
            .not("push_token", "is", null)
            .not("pregnancy_week", "is", null)
            .lt("last_login_at", twentyFourHoursAgo.toISOString());

        if (usersError) {
            throw usersError;
        }

        console.log(`Found ${users?.length || 0} eligible users for ${triggerId}`);

        // Check for already scheduled messages today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: existingMessages } = await supabase
            .from("proactive_conversations")
            .select("user_id")
            .eq("trigger_type_id", triggerId)
            .gte("scheduled_at", today.toISOString())
            .in("status", ["pending", "sent"]);

        const alreadySentUserIds = new Set(existingMessages?.map((m) => m.user_id) || []);

        // Filter out users who already got a message today
        const eligibleUsers = users?.filter((u) => !alreadySentUserIds.has(u.id)) || [];

        console.log(`${eligibleUsers.length} users after filtering`);

        let scheduled = 0;
        const errors: string[] = [];

        for (const user of eligibleUsers) {
            try {
                // Get user's persona
                const { data: persona } = await supabase
                    .from("ai_personas")
                    .select("system_prompt")
                    .eq("id", user.ai_persona_id)
                    .single();

                // Generate personalized message using Gemini
                const prompt = (trigger.message_template || "")
                    .replace("{pregnancy_week}", String(user.pregnancy_week));

                const geminiResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [
                                {
                                    role: "user",
                                    parts: [{ text: `${persona?.system_prompt || ""}\n\n${prompt}` }],
                                },
                            ],
                            generationConfig: {
                                maxOutputTokens: 200,
                                temperature: 0.8,
                            },
                        }),
                    }
                );

                const geminiData = await geminiResponse.json();
                const messageContent =
                    geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
                    `안녕하세요! 임신 ${user.pregnancy_week}주차 맘, 오늘 하루 어떠셨나요? 💕`;

                // Schedule proactive message
                await supabase.from("proactive_conversations").insert({
                    user_id: user.id,
                    trigger_type_id: triggerId,
                    scheduled_at: new Date().toISOString(),
                    message_content: messageContent,
                    status: "pending",
                });

                // Send push notification via web app API
                await fetch(`${webAppUrl}/api/push/send`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({
                        pushToken: user.push_token,
                        title: "👩‍⚕️ 오늘 하루 어떠셨나요?",
                        body: messageContent.substring(0, 100),
                        data: { type: "proactive_conversation" },
                    }),
                });

                scheduled++;
            } catch (err) {
                errors.push(`User ${user.id}: ${err.message}`);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                triggerId,
                scheduled,
                errors: errors.length > 0 ? errors : undefined,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Proactive chat error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
