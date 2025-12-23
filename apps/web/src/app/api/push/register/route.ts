/**
 * POST /api/push/register - Register push token for user
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
        const { pushToken } = await request.json();
        const supabase = await createSupabaseClient();

        if (!pushToken || typeof pushToken !== "string") {
            return NextResponse.json(
                { error: "pushToken is required" },
                { status: 400 }
            );
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error: updateError } = await supabase
            .from("users")
            .update({
                push_token: pushToken,
                push_enabled: true,
            })
            .eq("id", user.id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: "Push token registered",
        });
    } catch (error) {
        console.error("Push register error:", error);
        return NextResponse.json(
            { error: "Failed to register push token" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error: updateError } = await supabase
            .from("users")
            .update({
                push_token: null,
                push_enabled: false,
            })
            .eq("id", user.id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: "Push token unregistered",
        });
    } catch (error) {
        console.error("Push unregister error:", error);
        return NextResponse.json(
            { error: "Failed to unregister push token" },
            { status: 500 }
        );
    }
}
