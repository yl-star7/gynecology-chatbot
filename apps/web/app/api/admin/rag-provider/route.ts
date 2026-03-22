import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { supabaseSelect, supabaseInsert, supabaseUpdate } from "@/lib/mobile/supabase-rest";

const CONFIG_KEY = "rag_provider";

type RagProvider = "schift" | "supabase" | "auto";

const DEFAULT_CONFIG = {
  ragProvider: "auto" as RagProvider,
};

type ConfigRow = { key: string; value: typeof DEFAULT_CONFIG };

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const rows = await supabaseSelect<ConfigRow[]>(
      `system_config?select=key,value&key=eq.${CONFIG_KEY}&limit=1`,
    );

    return NextResponse.json(rows[0]?.value ?? DEFAULT_CONFIG);
  } catch (error) {
    console.error("admin rag-provider GET error", error);
    return NextResponse.json({ error: "failed to load config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await request.json();
    const ragProvider = body.ragProvider;

    if (ragProvider !== "schift" && ragProvider !== "supabase" && ragProvider !== "auto") {
      return NextResponse.json(
        { error: "ragProvider must be 'schift', 'supabase', or 'auto'" },
        { status: 400 },
      );
    }

    const config = { ragProvider };

    const existing = await supabaseSelect<ConfigRow[]>(
      `system_config?select=key&key=eq.${CONFIG_KEY}&limit=1`,
    );

    if (existing.length > 0) {
      await supabaseUpdate(`system_config?key=eq.${CONFIG_KEY}`, {
        value: config,
        updated_at: new Date().toISOString(),
      });
    } else {
      await supabaseInsert("system_config", {
        key: CONFIG_KEY,
        value: config,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, ragProvider });
  } catch (error) {
    console.error("admin rag-provider PUT error", error);
    return NextResponse.json({ error: "failed to save config" }, { status: 500 });
  }
}
