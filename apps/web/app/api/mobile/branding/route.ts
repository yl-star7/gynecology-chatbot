import { NextResponse } from "next/server";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

import { createSignedReadUrl } from "@/lib/admin/gcs-storage";

const BRANDING_KEY = "ui_branding";
const CHARACTER_IMAGES_KEY = "character_images";
const CHARACTER_IMAGE_TONES = [
  "neutral",
  "calm",
  "joyful",
  "anxious",
  "tired",
  "sad",
] as const;

type CharacterImageTone = (typeof CHARACTER_IMAGE_TONES)[number];

type BrandingConfig = {
  mascotBucketId: string | null;
  mascotObjectPath: string | null;
  mascotSourceFileName: string | null;
  mascotAltText: string | null;
  surveyFormUrl: string | null;
  externalSurveys?: ExternalSurveyConfig[];
};

type ExternalSurveyConfig = {
  id: string;
  label: string;
  url: string | null;
  visible: boolean;
};

type CharacterImagesConfig = {
  version: string;
  images: Record<CharacterImageTone, string>;
};

const DEFAULT_MASCOT_BUCKET_ID = "pregnancy-content";
const DEFAULT_MASCOT_OBJECT_PATH = "assets/penguin-nurse/app/neutral.png";
const DEFAULT_MASCOT_ALT_TEXT = "펭귄 간호사";

const DEFAULT_BRANDING: BrandingConfig = {
  mascotBucketId: DEFAULT_MASCOT_BUCKET_ID,
  mascotObjectPath: DEFAULT_MASCOT_OBJECT_PATH,
  mascotSourceFileName: "neutral.png",
  mascotAltText: DEFAULT_MASCOT_ALT_TEXT,
  surveyFormUrl: null,
};

function buildDefaultCharacterImageUrl(tone: CharacterImageTone) {
  return `https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/${tone}.png`;
}

const DEFAULT_CHARACTER_IMAGES: CharacterImagesConfig = {
  version: "gcs-penguin-nurse-v1",
  images: Object.fromEntries(
    CHARACTER_IMAGE_TONES.map((tone) => [
      tone,
      buildDefaultCharacterImageUrl(tone),
    ]),
  ) as Record<CharacterImageTone, string>,
};

function asBrandingConfig(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as BrandingConfig;
}

function visibleExternalSurveys(branding: BrandingConfig | null) {
  return Array.isArray(branding?.externalSurveys)
    ? branding.externalSurveys.filter((survey) => survey.visible && survey.url)
    : [];
}

function resolveMascotConfig(
  branding: BrandingConfig | null,
): { bucketId: string; objectPath: string; altText: string } {
  const bucketId = branding?.mascotBucketId?.trim();
  const objectPath = branding?.mascotObjectPath?.trim();
  const altText = branding?.mascotAltText?.trim();

  return {
    bucketId: bucketId || DEFAULT_MASCOT_BUCKET_ID,
    objectPath: objectPath || DEFAULT_MASCOT_OBJECT_PATH,
    altText: altText || DEFAULT_MASCOT_ALT_TEXT,
  };
}

function buildPublicGcsImageUrl(bucketId: string, objectPath: string) {
  return encodeURI(
    `https://storage.googleapis.com/${bucketId}/${objectPath.replace(/^\/+/, "")}`,
  );
}

async function createMascotImageUrl(input: {
  bucketId: string;
  objectPath: string;
}) {
  try {
    const { signedUrl } = await createSignedReadUrl({
      bucketId: input.bucketId,
      objectPath: input.objectPath,
      expiresMs: 60 * 60 * 24 * 7 * 1000,
    });
    return signedUrl;
  } catch (error) {
    console.warn("mobile branding mascot signed url fallback", error);
    return buildPublicGcsImageUrl(input.bucketId, input.objectPath);
  }
}

function isValidHttpsUrl(input: unknown) {
  if (typeof input !== "string" || !input.trim()) {
    return false;
  }

  try {
    return new URL(input.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

function asCharacterImagesConfig(
  value: Prisma.JsonValue | null | undefined,
): CharacterImagesConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_CHARACTER_IMAGES;
  }

  const record = value as {
    version?: unknown;
    images?: Partial<Record<CharacterImageTone, unknown>>;
  };
  if (!record.images || typeof record.images !== "object") {
    return DEFAULT_CHARACTER_IMAGES;
  }

  return {
    version:
      typeof record.version === "string" && record.version.trim()
        ? record.version
        : DEFAULT_CHARACTER_IMAGES.version,
    images: {
      ...DEFAULT_CHARACTER_IMAGES.images,
      ...Object.fromEntries(
        CHARACTER_IMAGE_TONES.flatMap((tone) => {
          const url = record.images?.[tone];
          return isValidHttpsUrl(url) ? [[tone, String(url).trim()]] : [];
        }),
      ),
    },
  } as CharacterImagesConfig;
}

export async function GET() {
  try {
    const [brandingRow, characterImagesRow] = await Promise.all([
      prisma.system_config.findUnique({
        where: { key: BRANDING_KEY },
        select: { value: true },
      }),
      prisma.system_config.findUnique({
        where: { key: CHARACTER_IMAGES_KEY },
        select: { value: true },
      }),
    ]);
    const branding = asBrandingConfig(brandingRow?.value);
    const characterImages = asCharacterImagesConfig(characterImagesRow?.value);
    const externalSurveys = visibleExternalSurveys(branding);
    const surveyFormUrl = externalSurveys[0]?.url ?? null;
    const mascot = resolveMascotConfig(branding);
    const mascotImageUrl = await createMascotImageUrl(mascot);

    return NextResponse.json({
      mascotImageUrl,
      mascotAltText: mascot.altText,
      surveyFormUrl,
      externalSurveys,
      characterImages,
    });
  } catch (error) {
    console.error("mobile branding GET error", error);
    return NextResponse.json(
      {
        mascotImageUrl: null,
        mascotAltText: null,
        surveyFormUrl: null,
        externalSurveys: [],
        characterImages: DEFAULT_CHARACTER_IMAGES,
      },
      { status: 200 },
    );
  }
}
