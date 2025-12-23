/**
 * POST /api/messages/share - Enable sharing for a saved message
 * GET /api/messages/share/[token] - Get shared message
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

// Enable sharing
export async function POST(request: NextRequest) {
    try {
        const { savedMessageId, expiresInDays = 7 } = await request.json();
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Calculate expiry date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        const { data: savedMessage, error } = await supabase
            .from("saved_messages")
            .update({
                is_shared: true,
                share_expires_at: expiresAt.toISOString(),
            })
            .eq("id", savedMessageId)
            .eq("user_id", user.id)
            .select("share_token")
            .single();

        if (error) throw error;

        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared/${savedMessage.share_token}`;

        return NextResponse.json({
            success: true,
            shareUrl,
            shareToken: savedMessage.share_token,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        console.error("Enable sharing error:", error);
        return NextResponse.json(
            { error: "Failed to enable sharing" },
            { status: 500 }
        );
    }
}

// Disable sharing
export async function DELETE(request: NextRequest) {
    try {
        const { savedMessageId } = await request.json();
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await supabase
            .from("saved_messages")
            .update({
                is_shared: false,
                share_expires_at: null,
            })
            .eq("id", savedMessageId)
            .eq("user_id", user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Disable sharing error:", error);
        return NextResponse.json(
            { error: "Failed to disable sharing" },
            { status: 500 }
        );
    }
}
