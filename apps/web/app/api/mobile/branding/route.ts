import { NextResponse } from "next/server";
import { ensureStorageBucket } from "@/lib/admin/supabase-storage";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";

const BRANDING_KEY = "ui_branding";

type BrandingConfig = {
  mascotBucketId: string | null;
  mascotObjectPath: string | null;
  mascotSourceFileName: string | null;
  mascotAltText: string | null;
  surveyFormUrl: string | null;
};

type ConfigRow = { key: string; value: BrandingConfig };

export async function GET() {
  try {
    const rows = await supabaseSelect<ConfigRow[]>(
      `system_config?select=key,value&key=eq.${BRANDING_KEY}&limit=1`,
    );
    const branding = rows[0]?.value;

    if (!branding?.mascotBucketId || !branding?.mascotObjectPath) {
      return NextResponse.json({
        mascotImageUrl: null,
        mascotAltText: null,
        surveyFormUrl: branding?.surveyFormUrl ?? null,
      });
    }

    const client = await ensureStorageBucket(branding.mascotBucketId);
    const { data, error } = await client.storage
      .from(branding.mascotBucketId)
      .createSignedUrl(branding.mascotObjectPath, 60 * 60 * 24 * 7);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      mascotImageUrl: data.signedUrl,
      mascotAltText: branding.mascotAltText ?? "마스코트",
      surveyFormUrl: branding.surveyFormUrl ?? null,
    });
  } catch (error) {
    console.error("mobile branding GET error", error);
    return NextResponse.json(
      { mascotImageUrl: null, mascotAltText: null, surveyFormUrl: null },
      { status: 200 },
    );
  }
}
