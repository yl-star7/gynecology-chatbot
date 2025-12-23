/**
 * POST /api/surveys/[id]/submit - Submit survey response
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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: templateId } = await params;
        const { responses, aiGeneratedQuestions } = await request.json();
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

        // Check if survey template exists
        const { data: template, error: templateError } = await supabase
            .from("survey_templates")
            .select("id, title")
            .eq("id", templateId)
            .single();

        if (templateError || !template) {
            return NextResponse.json({ error: "Survey not found" }, { status: 404 });
        }

        // Save response
        const { data: surveyResponse, error: saveError } = await supabase
            .from("survey_responses")
            .insert({
                user_id: user.id,
                template_id: templateId,
                responses,
                ai_generated_questions: aiGeneratedQuestions || null,
                pregnancy_week: userData?.pregnancy_week,
                completed_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (saveError) throw saveError;

        return NextResponse.json({
            success: true,
            surveyResponse,
        });
    } catch (error) {
        console.error("Submit survey error:", error);
        return NextResponse.json(
            { error: "Failed to submit survey" },
            { status: 500 }
        );
    }
}
