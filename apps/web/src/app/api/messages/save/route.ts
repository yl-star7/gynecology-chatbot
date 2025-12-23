/**
 * POST /api/messages/save - Save a message for later
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

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
        const { messageId, conversationId, title, note, tags } = await request.json();
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify message exists and belongs to user
        const { data: message, error: msgError } = await supabase
            .from("messages")
            .select("id, conversation_id")
            .eq("id", messageId)
            .single();

        if (msgError || !message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        // Verify conversation belongs to user
        const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .select("user_id")
            .eq("id", conversationId)
            .single();

        if (convError || conversation?.user_id !== user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Generate share token for potential future sharing
        const shareToken = crypto.randomBytes(16).toString("hex");

        const { data: savedMessage, error: saveError } = await supabase
            .from("saved_messages")
            .insert({
                user_id: user.id,
                message_id: messageId,
                conversation_id: conversationId,
                title: title || null,
                note: note || null,
                tags: tags || [],
                share_token: shareToken,
                is_shared: false,
            })
            .select()
            .single();

        if (saveError) throw saveError;

        return NextResponse.json({
            success: true,
            savedMessage,
        });
    } catch (error) {
        console.error("Save message error:", error);
        return NextResponse.json(
            { error: "Failed to save message" },
            { status: 500 }
        );
    }
}
