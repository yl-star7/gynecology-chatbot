/**
 * GET /api/messages/saved - Get user's saved messages
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

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient();
        const searchParams = request.nextUrl.searchParams;
        const tag = searchParams.get("tag");

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let query = supabase
            .from("saved_messages")
            .select(`
        *,
        message:messages(content, role, created_at),
        conversation:conversations(title)
      `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (tag) {
            query = query.contains("tags", [tag]);
        }

        const { data: savedMessages, error } = await query;

        if (error) throw error;

        return NextResponse.json({ savedMessages });
    } catch (error) {
        console.error("Get saved messages error:", error);
        return NextResponse.json(
            { error: "Failed to get saved messages" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await supabase
            .from("saved_messages")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete saved message error:", error);
        return NextResponse.json(
            { error: "Failed to delete saved message" },
            { status: 500 }
        );
    }
}
