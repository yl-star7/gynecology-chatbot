/**
 * Conversations API
 * GET /api/conversations - List user's conversations
 * POST /api/conversations - Create new conversation
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

// GET - List conversations
export async function GET() {
    try {
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: conversations, error } = await supabase
            .from("conversations")
            .select(`
        id,
        title,
        created_at,
        last_message_at,
        message_count,
        status
      `)
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("last_message_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error("Get conversations error:", error);
        return NextResponse.json(
            { error: "Failed to get conversations" },
            { status: 500 }
        );
    }
}

// POST - Create new conversation
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title } = await request.json();

        const { data: conversation, error } = await supabase
            .from("conversations")
            .insert({
                user_id: user.id,
                title: title || "새 대화",
                status: "active",
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ conversation });
    } catch (error) {
        console.error("Create conversation error:", error);
        return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500 }
        );
    }
}
