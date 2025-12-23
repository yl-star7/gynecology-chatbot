/**
 * GET /api/personas/current - Get current user's persona
 */

import { NextResponse } from "next/server";
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

        // Get user's current persona ID
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("ai_persona_id")
            .eq("id", user.id)
            .single();

        if (userError) throw userError;

        // Get persona details
        const { data: persona, error: personaError } = await supabase
            .from("ai_personas")
            .select("*")
            .eq("id", userData?.ai_persona_id || "default")
            .single();

        if (personaError) throw personaError;

        return NextResponse.json({ persona });
    } catch (error) {
        console.error("Current persona fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch current persona" },
            { status: 500 }
        );
    }
}
