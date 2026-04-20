import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SERVICEROLE;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase storage configuration missing");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
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
    const { data, error } = await client.storage
      .from(branding.mascotBucketId)
      .createSignedUrl(branding.mascotObjectPath, 60 * 60 * 24 * 7);

    if (error) {
      throw error;
    }

    return c.json({
      mascotImageUrl: data.signedUrl,
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
