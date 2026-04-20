import { NextResponse } from "next/server";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

import { createSignedReadUrl } from "@/lib/admin/gcs-storage";

const BRANDING_KEY = "ui_branding";

type BrandingConfig = {
  mascotBucketId: string | null;
  mascotObjectPath: string | null;
  mascotSourceFileName: string | null;
  mascotAltText: string | null;
  surveyFormUrl: string | null;
};

function asBrandingConfig(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as BrandingConfig;
}

export async function GET() {
  try {
    const row = await prisma.system_config.findUnique({
      where: { key: BRANDING_KEY },
      select: { value: true },
    });
    const branding = asBrandingConfig(row?.value);

    if (!branding?.mascotBucketId || !branding?.mascotObjectPath) {
      return NextResponse.json({
        mascotImageUrl: null,
        mascotAltText: null,
        surveyFormUrl: branding?.surveyFormUrl ?? null,
      });
    }

    const { signedUrl } = await createSignedReadUrl({
      bucketId: branding.mascotBucketId,
      objectPath: branding.mascotObjectPath,
      expiresMs: 60 * 60 * 24 * 7 * 1000,
    });

    return NextResponse.json({
      mascotImageUrl: signedUrl,
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
