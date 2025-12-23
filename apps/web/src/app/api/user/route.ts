/**
 * User Profile API
 * GET /api/user - Get current user profile
 * PATCH /api/user - Update user profile
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// GET - Get current user profile
export async function GET() {
    try {
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error } = await supabase
            .from("users")
            .select(`
        id,
        email,
        full_name,
        phone_number,
        date_of_birth,
        pregnancy_week,
        due_date,
        medical_history,
        allergies,
        current_medications,
        preferences,
        onboarding_completed,
        ai_persona_id,
        push_enabled,
        created_at
      `)
            .eq("id", user.id)
            .single();

        if (error) throw error;

        // Get user's AI persona
        const { data: persona } = await supabase
            .from("ai_personas")
            .select("id, name, description, avatar_url")
            .eq("id", profile.ai_persona_id)
            .single();

        return NextResponse.json({
            profile: {
                ...profile,
                persona,
            },
        });
    } catch (error) {
        console.error("Get user profile error:", error);
        return NextResponse.json(
            { error: "Failed to get profile" },
            { status: 500 }
        );
    }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const updates = await request.json();

        // Allowed fields to update
        const allowedFields = [
            "full_name",
            "phone_number",
            "date_of_birth",
            "pregnancy_week",
            "due_date",
            "medical_history",
            "allergies",
            "current_medications",
            "preferences",
            "ai_persona_id",
            "push_enabled",
        ];

        // Filter to only allowed fields
        const filteredUpdates: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (key in updates) {
                filteredUpdates[key] = updates[key];
            }
        }

        const { data: profile, error } = await supabase
            .from("users")
            .update(filteredUpdates)
            .eq("id", user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ profile });
    } catch (error) {
        console.error("Update user profile error:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
