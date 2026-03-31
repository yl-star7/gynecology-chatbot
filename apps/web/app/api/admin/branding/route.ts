import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

const BRANDING_KEY = "ui_branding";

type BrandingConfig = {
  mascotBucketId: string | null;
  mascotObjectPath: string | null;
  mascotSourceFileName: string | null;
  mascotAltText: string | null;
  surveyFormUrl: string | null;
};

const DEFAULT_BRANDING: BrandingConfig = {
  mascotBucketId: null,
  mascotObjectPath: null,
  mascotSourceFileName: null,
  mascotAltText: "마스코트",
  surveyFormUrl: null,
};

type ConfigRow = { key: string; value: BrandingConfig };

function normalizeSurveyFormUrl(input: unknown) {
  if (typeof input !== "string" || !input.trim()) {
    return null;
  }

  try {
    const parsedUrl = new URL(input.trim());
    const isAllowedHost =
      parsedUrl.hostname === "docs.google.com" ||
      parsedUrl.hostname === "forms.gle";
    const isAllowedPath =
      parsedUrl.hostname === "forms.gle" ||
      parsedUrl.pathname.startsWith("/forms/");

    if (parsedUrl.protocol !== "https:" || !isAllowedHost || !isAllowedPath) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const client = getSupabaseAdminClient();
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: rows, error } = await client
      .from("system_config")
      .select("key,value")
      .eq("key", BRANDING_KEY)
      .limit(1);
    if (error) {
      throw error;
    }

    return NextResponse.json(rows[0]?.value ?? DEFAULT_BRANDING);
  } catch (error) {
    console.error("admin branding GET error", error);
    return NextResponse.json(
      { error: "failed to load branding" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseAdminClient();
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<BrandingConfig>;
    const normalizedSurveyFormUrl = normalizeSurveyFormUrl(body.surveyFormUrl);
    if (body.surveyFormUrl && !normalizedSurveyFormUrl) {
      return NextResponse.json(
        { error: "survey form url must be a valid Google Forms https URL" },
        { status: 400 },
      );
    }
    const branding: BrandingConfig = {
      ...DEFAULT_BRANDING,
      ...body,
      surveyFormUrl: normalizedSurveyFormUrl,
    };

    const { data: existing, error: existingError } = await client
      .from("system_config")
      .select("key")
      .eq("key", BRANDING_KEY)
      .limit(1);
    if (existingError) {
      throw existingError;
    }

    if (existing.length > 0) {
      const { error } = await client
        .from("system_config")
        .update({ value: branding, updated_at: new Date().toISOString() })
        .eq("key", BRANDING_KEY);
      if (error) {
        throw error;
      }
    } else {
      const { error } = await client.from("system_config").insert({
        key: BRANDING_KEY,
        value: branding,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ ok: true, branding });
  } catch (error) {
    console.error("admin branding PUT error", error);
    return NextResponse.json(
      { error: "failed to save branding" },
      { status: 500 },
    );
  }
}
