import { NextRequest, NextResponse } from "next/server";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { readAdminSessionUser } from "@/lib/admin/auth";

const CONFIG_KEY = "rag_provider";

type RagProvider = "schift";

const DEFAULT_CONFIG = {
  ragProvider: "schift" as RagProvider,
};

type ConfigRow = { key: string; value: typeof DEFAULT_CONFIG };

function asConfig(
  value: Prisma.JsonValue | null | undefined,
): ConfigRow["value"] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const rawProvider = (value as { ragProvider?: unknown }).ragProvider;
  if (rawProvider === "schift") {
    return { ragProvider: "schift" };
  }

  return null;
}

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const row = await prisma.system_config.findUnique({
      where: { key: CONFIG_KEY },
      select: { key: true, value: true },
    });

    return NextResponse.json(asConfig(row?.value) ?? DEFAULT_CONFIG);
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
    const admin = await readAdminSessionUser();
    if (!admin)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await request.json();
    const ragProvider = body.ragProvider;

    if (ragProvider !== "schift") {
      return NextResponse.json(
        { error: "ragProvider must be 'schift'" },
        { status: 400 },
      );
    }

    const config = { ragProvider };

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

    return NextResponse.json({ ok: true, ragProvider });
  } catch (error) {
    console.error("admin rag-provider PUT error", error);
    return NextResponse.json(
      { error: "failed to save config" },
      { status: 500 },
    );
  }
}
