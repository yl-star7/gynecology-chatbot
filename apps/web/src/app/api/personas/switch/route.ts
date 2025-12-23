/**
 * POST /api/personas/switch - Switch to a different persona
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

export async function POST(request: NextRequest) {
    try {
        const { personaId } = await request.json();
        const supabase = await createSupabaseClient();

        if (!personaId || typeof personaId !== "string") {
            return NextResponse.json(
                { error: "personaId is required" },
                { status: 400 }
            );
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify persona exists
        const { data: persona, error: personaError } = await supabase
            .from("ai_personas")
            .select("id, name")
            .eq("id", personaId)
            .eq("is_active", true)
            .single();

        if (personaError || !persona) {
            return NextResponse.json(
                { error: "Persona not found" },
                { status: 404 }
            );
        }

        // Update user's persona
        const { error: updateError } = await supabase
            .from("users")
            .update({ ai_persona_id: personaId })
            .eq("id", user.id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: `Switched to ${persona.name}`,
            personaId,
        });
    } catch (error) {
        console.error("Persona switch error:", error);
        return NextResponse.json(
            { error: "Failed to switch persona" },
            { status: 500 }
        );
    }
}
