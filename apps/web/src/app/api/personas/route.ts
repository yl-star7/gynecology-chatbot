/**
 * AI Persona API
 * GET /api/personas - List all personas
 * GET /api/personas/current - Get current user's persona
 * POST /api/personas/switch - Switch persona
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

// GET /api/personas - List all active personas
export async function GET() {
    try {
        const supabase = await createSupabaseClient();

        const { data: personas, error } = await supabase
            .from("ai_personas")
            .select("*")
            .eq("is_active", true)
            .order("created_at");

        if (error) throw error;

        return NextResponse.json({ personas });
    } catch (error) {
        console.error("Personas fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch personas" },
            { status: 500 }
        );
    }
}
