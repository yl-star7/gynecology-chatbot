/**
 * Survey API
 * GET /api/surveys/current - Get current week's survey for user
 * POST /api/surveys/:id/submit - Submit survey response
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

// GET /api/surveys/current
export async function GET() {
    try {
        const supabase = await createSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's pregnancy week
        const { data: userData } = await supabase
            .from("users")
            .select("pregnancy_week")
            .eq("id", user.id)
            .single();

        const pregnancyWeek = userData?.pregnancy_week;

        // Find matching survey templates
        let query = supabase
            .from("survey_templates")
            .select("*")
            .eq("is_active", true);

        if (pregnancyWeek) {
            query = query
                .lte("pregnancy_week_min", pregnancyWeek)
                .gte("pregnancy_week_max", pregnancyWeek);
        }

        const { data: surveys, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;

        // Check which surveys user has already completed
        const { data: completedSurveys } = await supabase
            .from("survey_responses")
            .select("template_id")
            .eq("user_id", user.id)
            .not("completed_at", "is", null);

        const completedIds = new Set(completedSurveys?.map(s => s.template_id) || []);

        // Filter to pending surveys
        const pendingSurveys = surveys?.filter(s => !completedIds.has(s.id)) || [];

        return NextResponse.json({
            surveys: pendingSurveys,
            currentWeek: pregnancyWeek,
        });
    } catch (error) {
        console.error("Get surveys error:", error);
        return NextResponse.json(
            { error: "Failed to get surveys" },
            { status: 500 }
        );
    }
}
