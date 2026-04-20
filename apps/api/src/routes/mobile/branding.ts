import { Hono } from "hono";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import { Storage } from "@google-cloud/storage";

const app = new Hono();

const BRANDING_KEY = "ui_branding";

type BrandingConfig = {
  mascotBucketId: string | null;
  mascotObjectPath: string | null;
  mascotSourceFileName: string | null;
  mascotAltText: string | null;
  surveyFormUrl: string | null;
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

app.get("/", async (c) => {
  try {
    const row = await prisma.system_config.findUnique({
      where: { key: BRANDING_KEY },
      select: { value: true },
    });
    const branding = row ? asBrandingConfig(row.value) : null;

    if (!branding?.mascotBucketId || !branding?.mascotObjectPath) {
      return c.json({
        mascotImageUrl: null,
        mascotAltText: null,
        surveyFormUrl: branding?.surveyFormUrl ?? null,
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
    });
  } catch (error) {
    console.error("mobile branding GET error", error);
    return c.json(
      { mascotImageUrl: null, mascotAltText: null, surveyFormUrl: null },
      200,
    );
  }
});

export default app;
