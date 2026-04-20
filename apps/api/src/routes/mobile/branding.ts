import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { supabaseSelect } from "@gynecology-chatbot/mobile-api/supabase/admin-client";

const app = new Hono();

const BRANDING_KEY = "ui_branding";

type BrandingConfig = {
  mascotBucketId: string | null;
  mascotObjectPath: string | null;
  mascotSourceFileName: string | null;
  mascotAltText: string | null;
  surveyFormUrl: string | null;
};

type ConfigRow = { key: string; value: BrandingConfig };

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

app.get("/", async (c) => {
  try {
    const rows = await supabaseSelect<ConfigRow[]>(
      `system_config?select=key,value&key=eq.${BRANDING_KEY}&limit=1`,
    );
    const branding = rows[0]?.value;

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
