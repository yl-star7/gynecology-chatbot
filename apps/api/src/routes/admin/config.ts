import { Hono } from "hono";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import {
  DEFAULT_MOBILE_ASK_PROMPT_CONFIG,
  MOBILE_ASK_PROMPT_KEY,
  normalizeMobileAskPromptConfig,
  type MobileAskPromptConfig,
} from "@gynecology-chatbot/mobile-api/ask-prompt";

import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

const RAG_PROVIDER_KEY = "rag_provider";
const BRANDING_KEY = "ui_branding";
const CHARACTER_IMAGES_KEY = "character_images";
const SCHEDULE_KEY = "notification_schedule";
const APPROVAL_POLICY_KEY = "mobile_approval_policy";
const CHARACTER_IMAGE_TONES = [
  "neutral",
  "calm",
  "joyful",
  "anxious",
  "tired",
  "sad",
] as const;

type CharacterImageTone = (typeof CHARACTER_IMAGE_TONES)[number];

type RagProvider = "schift";

const DEFAULT_RAG_PROVIDER = {
  ragProvider: "schift" as RagProvider,
};

type BrandingConfig = {
  mascotBucketId: string | null;
  mascotObjectPath: string | null;
  mascotSourceFileName: string | null;
  mascotAltText: string | null;
  surveyFormUrl: string | null;
  externalSurveys: ExternalSurveyConfig[];
};

type ExternalSurveyConfig = {
  id: string;
  label: string;
  url: string | null;
  visible: boolean;
};

const DEFAULT_EXTERNAL_SURVEYS: ExternalSurveyConfig[] = [
  {
    id: "survey-1",
    label: "1차 설문지",
    url: "https://forms.gle/ZoLxWPdwid1F94FE8",
    visible: true,
  },
  {
    id: "survey-2",
    label: "2차 설문지",
    url: "https://forms.gle/LvFmEZHkGM3MMLQ8A",
    visible: true,
  },
  {
    id: "survey-3",
    label: "3차 설문지",
    url: "https://forms.gle/fNUX6qDjXR5wXoGt7",
    visible: true,
  },
];

const DEFAULT_BRANDING: BrandingConfig = {
  mascotBucketId: "pregnancy-content",
  mascotObjectPath: "assets/penguin-nurse/app/neutral.png",
  mascotSourceFileName: "neutral.png",
  mascotAltText: "펭귄 간호사",
  surveyFormUrl: DEFAULT_EXTERNAL_SURVEYS[0]?.url ?? null,
  externalSurveys: DEFAULT_EXTERNAL_SURVEYS,
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

const DEFAULT_SCHEDULE = {
  dailyCheckEnabled: true,
  dailyCheckTime: "09:00",
  weeklyMilestoneEnabled: true,
  weeklyMilestoneDay: 1,
  weeklyMilestoneTime: "10:00",
  checkupReminderEnabled: true,
  checkupReminderTime: "18:00",
};

type ScheduleConfig = typeof DEFAULT_SCHEDULE;

const DEFAULT_APPROVAL_POLICY = {
  requireApproval: true,
};

type ApprovalPolicyConfig = typeof DEFAULT_APPROVAL_POLICY;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

app.use("*", requireAdminProxy);

function asRagProviderConfig(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const rawProvider = (value as { ragProvider?: unknown }).ragProvider;
  return rawProvider === "schift" ? DEFAULT_RAG_PROVIDER : null;
}

function asBrandingConfig(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Partial<BrandingConfig>;
  const externalSurveys = normalizeExternalSurveys(record.externalSurveys);
  return {
    ...DEFAULT_BRANDING,
    ...record,
    surveyFormUrl:
      normalizeSurveyFormUrl(record.surveyFormUrl) ??
      externalSurveys.find((survey) => survey.visible && survey.url)?.url ??
      null,
    externalSurveys,
  };
}

function asCharacterImagesConfig(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as {
    version?: unknown;
    images?: Partial<Record<CharacterImageTone, unknown>>;
  };
  if (!record.images || typeof record.images !== "object") {
    return null;
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
          return typeof url === "string" && isValidHttpsUrl(url)
            ? [[tone, url.trim()]]
            : [];
        }),
      ),
    },
  } as CharacterImagesConfig;
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

function asScheduleConfig(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ScheduleConfig)
    : null;
}

function asApprovalPolicyConfig(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return {
    requireApproval:
      typeof (value as { requireApproval?: unknown }).requireApproval ===
      "boolean"
        ? (value as { requireApproval: boolean }).requireApproval
        : DEFAULT_APPROVAL_POLICY.requireApproval,
  } satisfies ApprovalPolicyConfig;
}

function asMobileAskPromptConfig(value: Prisma.JsonValue | null | undefined) {
  return normalizeMobileAskPromptConfig(value);
}

function normalizeSurveyFormUrl(input: unknown) {
  if (typeof input !== "string" || !input.trim()) {
    return null;
  }

  try {
    const parsedUrl = new URL(input.trim());
    const isAllowedHost =
      parsedUrl.hostname === "docs.google.com" ||
      parsedUrl.hostname === "forms.gle";
    const isAllowedPath =
      parsedUrl.hostname === "forms.gle" ||
      parsedUrl.pathname.startsWith("/forms/");

    if (parsedUrl.protocol !== "https:" || !isAllowedHost || !isAllowedPath) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

function normalizeExternalSurveys(input: unknown): ExternalSurveyConfig[] {
  const inputById = new Map<string, Partial<ExternalSurveyConfig>>();
  if (Array.isArray(input)) {
    for (const item of input) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const record = item as Partial<ExternalSurveyConfig>;
      if (typeof record.id === "string") {
        inputById.set(record.id, record);
      }
    }
  }

  return DEFAULT_EXTERNAL_SURVEYS.map((fallback) => {
    const record = inputById.get(fallback.id);
    const label =
      typeof record?.label === "string" && record.label.trim()
        ? record.label.trim()
        : fallback.label;
    const url = normalizeSurveyFormUrl(record?.url) ?? fallback.url;
    return {
      id: fallback.id,
      label,
      url,
      visible:
        typeof record?.visible === "boolean" ? record.visible : fallback.visible,
    };
  });
}

function validateSchedule(body: Partial<ScheduleConfig>) {
  if (
    body.dailyCheckTime !== undefined &&
    !TIME_PATTERN.test(body.dailyCheckTime)
  ) {
    return "invalid dailyCheckTime format (HH:MM)";
  }
  if (
    body.weeklyMilestoneTime !== undefined &&
    !TIME_PATTERN.test(body.weeklyMilestoneTime)
  ) {
    return "invalid weeklyMilestoneTime format (HH:MM)";
  }
  if (
    body.checkupReminderTime !== undefined &&
    !TIME_PATTERN.test(body.checkupReminderTime)
  ) {
    return "invalid checkupReminderTime format (HH:MM)";
  }
  if (
    body.weeklyMilestoneDay !== undefined &&
    (typeof body.weeklyMilestoneDay !== "number" ||
      body.weeklyMilestoneDay < 0 ||
      body.weeklyMilestoneDay > 6)
  ) {
    return "invalid weeklyMilestoneDay (must be 0-6)";
  }

  return null;
}

async function upsertSystemConfig(key: string, value: Prisma.InputJsonValue) {
  const existing = await prisma.system_config.findUnique({
    where: { key },
    select: { key: true },
  });

  if (existing?.key) {
    await prisma.system_config.update({
      where: { key },
      data: { value, updated_at: new Date() },
    });
    return;
  }

  await prisma.system_config.create({
    data: { key, value, updated_at: new Date() },
  });
}

app.get("/rag-provider", async (c) => {
  try {
    const row = await prisma.system_config.findUnique({
      where: { key: RAG_PROVIDER_KEY },
      select: { key: true, value: true },
    });

    return c.json(asRagProviderConfig(row?.value) ?? DEFAULT_RAG_PROVIDER);
  } catch (error) {
    console.error("admin api rag-provider GET error", error);
    return c.json({ error: "failed to load config" }, 500);
  }
});

app.put("/rag-provider", async (c) => {
  try {
    const body = await c.req.json();
    if (body.ragProvider !== "schift") {
      return c.json({ error: "ragProvider must be 'schift'" }, 400);
    }

    await upsertSystemConfig(RAG_PROVIDER_KEY, {
      ragProvider: body.ragProvider,
    });
    return c.json({ ok: true, ragProvider: body.ragProvider });
  } catch (error) {
    console.error("admin api rag-provider PUT error", error);
    return c.json({ error: "failed to save config" }, 500);
  }
});

app.get("/branding", async (c) => {
  try {
    const row = await prisma.system_config.findUnique({
      where: { key: BRANDING_KEY },
      select: { value: true },
    });

    return c.json(asBrandingConfig(row?.value) ?? DEFAULT_BRANDING);
  } catch (error) {
    console.error("admin api branding GET error", error);
    return c.json({ error: "failed to load branding" }, 500);
  }
});

app.put("/branding", async (c) => {
  try {
    const body = (await c.req.json()) as Partial<BrandingConfig>;
    const normalizedSurveyFormUrl = normalizeSurveyFormUrl(body.surveyFormUrl);
    const externalSurveys = normalizeExternalSurveys(body.externalSurveys);
    const hasInvalidExternalSurvey = Array.isArray(body.externalSurveys)
      ? body.externalSurveys.some((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return false;
          }
          const url = (item as { url?: unknown }).url;
          return Boolean(url) && !normalizeSurveyFormUrl(url);
        })
      : false;

    if (
      (body.surveyFormUrl && !normalizedSurveyFormUrl) ||
      hasInvalidExternalSurvey
    ) {
      return c.json(
        { error: "survey form url must be a valid Google Forms https URL" },
        400,
      );
    }

    const branding: BrandingConfig = {
      ...DEFAULT_BRANDING,
      ...body,
      surveyFormUrl:
        normalizedSurveyFormUrl ??
        externalSurveys.find((survey) => survey.visible && survey.url)?.url ??
        null,
      externalSurveys,
    };

    await upsertSystemConfig(BRANDING_KEY, branding as Prisma.InputJsonValue);
    return c.json({ ok: true, branding });
  } catch (error) {
    console.error("admin api branding PUT error", error);
    return c.json({ error: "failed to save branding" }, 500);
  }
});

app.get("/branding/character-images", async (c) => {
  try {
    const row = await prisma.system_config.findUnique({
      where: { key: CHARACTER_IMAGES_KEY },
      select: { value: true },
    });

    return c.json(
      asCharacterImagesConfig(row?.value) ?? DEFAULT_CHARACTER_IMAGES,
    );
  } catch (error) {
    console.error("admin api character images GET error", error);
    return c.json({ error: "failed to load character images" }, 500);
  }
});

app.put("/branding/character-images", async (c) => {
  try {
    const body = (await c.req.json()) as {
      images?: Partial<Record<CharacterImageTone, unknown>>;
    };
    const images = { ...DEFAULT_CHARACTER_IMAGES.images };

    for (const tone of CHARACTER_IMAGE_TONES) {
      const value = body.images?.[tone];
      if (!isValidHttpsUrl(value)) {
        return c.json(
          { error: `${tone} image must be a valid HTTPS URL` },
          400,
        );
      }
      images[tone] = String(value).trim();
    }

    const config: CharacterImagesConfig = {
      version: new Date().toISOString(),
      images,
    };
    await upsertSystemConfig(
      CHARACTER_IMAGES_KEY,
      config as Prisma.InputJsonValue,
    );

    return c.json({ ok: true, config });
  } catch (error) {
    console.error("admin api character images PUT error", error);
    return c.json({ error: "failed to save character images" }, 500);
  }
});

app.get("/approval-policy", async (c) => {
  try {
    const row = await prisma.system_config.findUnique({
      where: { key: APPROVAL_POLICY_KEY },
      select: { value: true },
    });

    return c.json(
      asApprovalPolicyConfig(row?.value) ?? DEFAULT_APPROVAL_POLICY,
    );
  } catch (error) {
    console.error("admin api approval-policy GET error", error);
    return c.json({ error: "failed to load approval policy" }, 500);
  }
});

app.put("/approval-policy", async (c) => {
  try {
    const body = (await c.req.json()) as Partial<ApprovalPolicyConfig>;
    if (typeof body.requireApproval !== "boolean") {
      return c.json({ error: "requireApproval must be boolean" }, 400);
    }

    const policy: ApprovalPolicyConfig = {
      requireApproval: body.requireApproval,
    };
    await upsertSystemConfig(
      APPROVAL_POLICY_KEY,
      policy as Prisma.InputJsonValue,
    );
    return c.json({ ok: true, ...policy });
  } catch (error) {
    console.error("admin api approval-policy PUT error", error);
    return c.json({ error: "failed to save approval policy" }, 500);
  }
});

app.get("/ask-prompt", async (c) => {
  try {
    const row = await prisma.system_config.findUnique({
      where: { key: MOBILE_ASK_PROMPT_KEY },
      select: { value: true },
    });

    return c.json(
      asMobileAskPromptConfig(row?.value) ?? DEFAULT_MOBILE_ASK_PROMPT_CONFIG,
    );
  } catch (error) {
    console.error("admin api ask-prompt GET error", error);
    return c.json({ error: "failed to load ask prompt" }, 500);
  }
});

app.put("/ask-prompt", async (c) => {
  try {
    const body = (await c.req.json()) as Partial<MobileAskPromptConfig>;
    if (typeof body.tonePrompt !== "string" || !body.tonePrompt.trim()) {
      return c.json({ error: "tonePrompt is required" }, 400);
    }

    const config = normalizeMobileAskPromptConfig(body);
    await upsertSystemConfig(
      MOBILE_ASK_PROMPT_KEY,
      config as Prisma.InputJsonValue,
    );
    return c.json({ ok: true, ...config });
  } catch (error) {
    console.error("admin api ask-prompt PUT error", error);
    return c.json({ error: "failed to save ask prompt" }, 500);
  }
});

app.get("/schedule", async (c) => {
  try {
    const row = await prisma.system_config.findUnique({
      where: { key: SCHEDULE_KEY },
      select: { value: true },
    });

    return c.json(asScheduleConfig(row?.value) ?? DEFAULT_SCHEDULE);
  } catch (error) {
    console.error("admin api schedule GET error", error);
    return c.json({ error: "failed to load schedule" }, 500);
  }
});

app.put("/schedule", async (c) => {
  try {
    const body = (await c.req.json()) as Partial<ScheduleConfig>;
    const validationError = validateSchedule(body);
    if (validationError) {
      return c.json({ error: validationError }, 400);
    }

    const schedule: ScheduleConfig = { ...DEFAULT_SCHEDULE, ...body };
    await upsertSystemConfig(SCHEDULE_KEY, schedule as Prisma.InputJsonValue);
    return c.json({ ok: true, schedule });
  } catch (error) {
    console.error("admin api schedule PUT error", error);
    return c.json({ error: "failed to save schedule" }, 500);
  }
});

export default app;
