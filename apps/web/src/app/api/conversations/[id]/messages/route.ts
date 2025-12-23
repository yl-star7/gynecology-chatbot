/**
 * Conversation Messages API
 * GET /api/conversations/[id]/messages - Get messages for a conversation
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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: conversationId } = await params;
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify conversation belongs to user
        const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .select("user_id")
            .eq("id", conversationId)
            .single();

        if (convError || conversation?.user_id !== user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Get messages
        const { data: messages, error } = await supabase
            .from("messages")
            .select(`
        id,
        role,
        content,
        attachments,
        rag_sources,
        created_at
      `)
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Get messages error:", error);
        return NextResponse.json(
            { error: "Failed to get messages" },
            { status: 500 }
        );
    }
}
