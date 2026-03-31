import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

const CONFIG_KEY = "character_images";

type CharacterImagesConfig = {
  calm: string | null;
  joyful: string | null;
  anxious: string | null;
  tired: string | null;
  sad: string | null;
};

const DEFAULT_CONFIG: CharacterImagesConfig = {
  calm: null,
  joyful: null,
  anxious: null,
  tired: null,
  sad: null,
};

const VALID_TONES = ["calm", "joyful", "anxious", "tired", "sad"] as const;

type ConfigRow = { key: string; value: CharacterImagesConfig };

function isValidHttpsUrl(input: unknown): boolean {
  if (typeof input !== "string" || !input.trim()) {
    return false;
  }
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:";
  } catch {
    return false;
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
      .eq("key", CONFIG_KEY)
      .limit(1);
    if (error) {
      throw error;
    }

    return NextResponse.json(rows[0]?.value ?? DEFAULT_CONFIG);
  } catch (error) {
    console.error("admin character-images GET error", error);
    return NextResponse.json(
      { error: "캐릭터 이미지 설정을 불러오지 못했습니다" },
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

    const body = (await request.json()) as Partial<CharacterImagesConfig>;

    // Validate: only accept known tone keys with HTTPS URLs or null
    const config: CharacterImagesConfig = { ...DEFAULT_CONFIG };

    for (const tone of VALID_TONES) {
      const value = body[tone];
      if (value === null || value === undefined) {
        config[tone] = null;
      } else if (isValidHttpsUrl(value)) {
        config[tone] = (value as string).trim();
      } else {
        return NextResponse.json(
          {
            error: `${tone} 항목은 유효한 HTTPS URL이거나 null이어야 합니다`,
          },
          { status: 400 },
        );
      }
    }

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
        .update({ value: config, updated_at: new Date().toISOString() })
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

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error("admin character-images PUT error", error);
    return NextResponse.json(
      { error: "캐릭터 이미지 설정을 저장하지 못했습니다" },
      { status: 500 },
    );
  }
}
