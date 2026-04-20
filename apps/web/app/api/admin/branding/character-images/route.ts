import { NextRequest, NextResponse } from "next/server";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { readAdminSessionUser } from "@/lib/admin/auth";

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

function asCharacterConfig(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CharacterImagesConfig)
    : null;
}

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
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const row = await prisma.system_config.findUnique({
      where: { key: CONFIG_KEY },
      select: { value: true },
    });

    return NextResponse.json(asCharacterConfig(row?.value) ?? DEFAULT_CONFIG);
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

    const existing = await prisma.system_config.findUnique({
      where: { key: CONFIG_KEY },
      select: { key: true },
    });

    if (existing?.key) {
      await prisma.system_config.update({
        where: { key: CONFIG_KEY },
        data: {
          value: config as Prisma.InputJsonValue,
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.system_config.create({
        data: {
          key: CONFIG_KEY,
          value: config as Prisma.InputJsonValue,
          updated_at: new Date(),
        },
      });
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
