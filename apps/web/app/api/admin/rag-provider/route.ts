import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

const CONFIG_KEY = "rag_provider";

type RagProvider = "schift" | "supabase" | "auto";

const DEFAULT_CONFIG = {
  ragProvider: "auto" as RagProvider,
};

type ConfigRow = { key: string; value: typeof DEFAULT_CONFIG };

export async function GET() {
  try {
    const client = getSupabaseAdminClient();
    const admin = await readAdminSessionUser();
    if (!admin)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: rows, error } = await client
      .from("system_config")
      .select("key,value")
      .eq("key", CONFIG_KEY)
      .limit(1);
    if (error) {
      throw error;
    }

    return NextResponse.json(rows[0]?.value ?? DEFAULT_CONFIG);
  } catch (error) {
    console.error("admin rag-provider GET error", error);
    return NextResponse.json(
      { error: "failed to load config" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseAdminClient();
    const admin = await readAdminSessionUser();
    if (!admin)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await request.json();
    const ragProvider = body.ragProvider;

    if (
      ragProvider !== "schift" &&
      ragProvider !== "supabase" &&
      ragProvider !== "auto"
    ) {
      return NextResponse.json(
        { error: "ragProvider must be 'schift', 'supabase', or 'auto'" },
        { status: 400 },
      );
    }

    const config = { ragProvider };

    const { data: existing, error: existingError } = await client
      .from("system_config")
      .select("key")
      .eq("key", CONFIG_KEY)
      .limit(1);
    if (existingError) {
      throw existingError;
    }

    if (existing.length > 0) {
      const { error } = await client
        .from("system_config")
        .update({
          value: config,
          updated_at: new Date().toISOString(),
        })
        .eq("key", CONFIG_KEY);
      if (error) {
        throw error;
      }
    } else {
      const { error } = await client.from("system_config").insert({
        key: CONFIG_KEY,
        value: config,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ ok: true, ragProvider });
  } catch (error) {
    console.error("admin rag-provider PUT error", error);
    return NextResponse.json(
      { error: "failed to save config" },
      { status: 500 },
    );
  }
}
