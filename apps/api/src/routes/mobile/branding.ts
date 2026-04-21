import { Hono } from "hono";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { Storage } from "@google-cloud/storage";

const app = new Hono();

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
};

type CharacterImagesConfig = {
  version: string;
  images: Record<CharacterImageTone, string>;
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

function getStorageClient() {
  return new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
}

function asBrandingConfig(value: Prisma.JsonValue): BrandingConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as BrandingConfig;
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

app.get("/", async (c) => {
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
    const branding = brandingRow ? asBrandingConfig(brandingRow.value) : null;
    const characterImages = asCharacterImagesConfig(characterImagesRow?.value);

    if (!branding?.mascotBucketId || !branding?.mascotObjectPath) {
      return c.json({
        mascotImageUrl: null,
        mascotAltText: null,
        surveyFormUrl: branding?.surveyFormUrl ?? null,
        characterImages,
      });
    }

    const client = getStorageClient();
    const [signedUrl] = await client
      .bucket(branding.mascotBucketId)
      .file(branding.mascotObjectPath)
      .getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 60 * 60 * 24 * 7 * 1000,
      });

    return c.json({
      mascotImageUrl: signedUrl,
      mascotAltText: branding.mascotAltText ?? "마스코트",
      surveyFormUrl: branding.surveyFormUrl ?? null,
      characterImages,
    });
  } catch (error) {
    console.error("mobile branding GET error", error);
    return c.json(
      {
        mascotImageUrl: null,
        mascotAltText: null,
        surveyFormUrl: null,
        characterImages: DEFAULT_CHARACTER_IMAGES,
      },
      200,
    );
  }
});

export default app;
