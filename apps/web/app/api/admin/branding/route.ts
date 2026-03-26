import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { supabaseInsert, supabaseSelect, supabaseUpdate } from "@/lib/mobile/supabase-rest";

const BRANDING_KEY = "ui_branding";

type BrandingConfig = {
  mascotBucketId: string | null;
  mascotObjectPath: string | null;
  mascotSourceFileName: string | null;
  mascotAltText: string | null;
};

const DEFAULT_BRANDING: BrandingConfig = {
  mascotBucketId: null,
  mascotObjectPath: null,
  mascotSourceFileName: null,
  mascotAltText: "마스코트",
};

type ConfigRow = { key: string; value: BrandingConfig };

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const rows = await supabaseSelect<ConfigRow[]>(
      `system_config?select=key,value&key=eq.${BRANDING_KEY}&limit=1`,
    );

    return NextResponse.json(rows[0]?.value ?? DEFAULT_BRANDING);
  } catch (error) {
    console.error("admin branding GET error", error);
    return NextResponse.json({ error: "failed to load branding" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<BrandingConfig>;
    const branding: BrandingConfig = {
      ...DEFAULT_BRANDING,
      ...body,
    };

    const existing = await supabaseSelect<ConfigRow[]>(
      `system_config?select=key&key=eq.${BRANDING_KEY}&limit=1`,
    );

    if (existing.length > 0) {
      await supabaseUpdate(`system_config?key=eq.${BRANDING_KEY}`, {
        value: branding,
        updated_at: new Date().toISOString(),
      });
    } else {
      await supabaseInsert("system_config", {
        key: BRANDING_KEY,
        value: branding,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, branding });
  } catch (error) {
    console.error("admin branding PUT error", error);
    return NextResponse.json({ error: "failed to save branding" }, { status: 500 });
  }
}
