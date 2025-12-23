/**
 * Onboarding API
 * POST /api/onboarding - Save onboarding data
 * GET /api/onboarding/status - Check onboarding status
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { OnboardingData } from "@gynecology-chatbot/types";

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

export async function POST(request: NextRequest) {
    try {
        const { data } = await request.json() as { data: OnboardingData };
        const supabase = await createSupabaseClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Determine AI persona based on preferences
        let aiPersonaId = "default";
        if (data.preferredCommunicationStyle === "formal") {
            aiPersonaId = "professional";
        } else if (data.preferredCommunicationStyle === "concise") {
            aiPersonaId = "concise";
        }

        // Update user with onboarding data
        const { error: updateError } = await supabase
            .from("users")
            .update({
                onboarding_completed: true,
                onboarding_data: data,
                ai_persona_id: aiPersonaId,
                pregnancy_week: data.pregnancyWeek,
                due_date: data.dueDate,
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("Onboarding update error:", updateError);
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            message: "Onboarding completed",
            aiPersonaId,
        });
    } catch (error) {
        console.error("Onboarding error:", error);
        return NextResponse.json(
            { error: "Failed to save onboarding data" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: userData, error } = await supabase
            .from("users")
            .select("onboarding_completed, onboarding_data, ai_persona_id")
            .eq("id", user.id)
            .single();

        if (error) throw error;

        return NextResponse.json({
            completed: userData?.onboarding_completed || false,
            data: userData?.onboarding_data || {},
            aiPersonaId: userData?.ai_persona_id || "default",
        });
    } catch (error) {
        console.error("Onboarding status error:", error);
        return NextResponse.json(
            { error: "Failed to get onboarding status" },
            { status: 500 }
        );
    }
}
