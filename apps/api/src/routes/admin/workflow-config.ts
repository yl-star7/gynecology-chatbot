import { Hono } from "hono";
import {
  DEFAULT_WORKFLOW_YAML_BUCKET,
  WORKFLOW_YAML_DB_CATALOG,
  buildWorkflowYamlStoragePath,
} from "@gynecology-chatbot/app-core";
import type { Prisma } from "@gynecology-chatbot/db/prisma";
import { prisma } from "@gynecology-chatbot/db/prisma";
import { patchSchiftWorkflow } from "@gynecology-chatbot/mobile-api/schift-workflows-api";

import { createAdminAuditLog } from "./audit.js";
import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

const STAGE_MAPPING_KEY = "workflow_stage_mapping";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Mapping = {
  baby_info: string | null;
  letter_reflection: string | null;
  free_chat: string | null;
  general: string | null;
  router?: string | null;
};

function emptyMapping(): Mapping {
  return {
    baby_info: null,
    letter_reflection: null,
    free_chat: null,
    general: null,
    router: null,
  };
}

function sanitizeMapping(input: unknown): Mapping {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return emptyMapping();
  const obj = input as Record<string, unknown>;
  const pick = (key: keyof Mapping): string | null => {
    const value = obj[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  return {
    baby_info: pick("baby_info"),
    letter_reflection: pick("letter_reflection"),
    free_chat: pick("free_chat"),
    general: pick("general"),
    router: pick("router"),
  };
}

function mapWorkflowRule(row: {
  id: string;
  name: string;
  slug?: string | null;
  provider: string;
  is_active: boolean;
  config: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
}) {
  const config =
    row.config && typeof row.config === "object" && !Array.isArray(row.config)
      ? (row.config as Record<string, unknown>)
      : {};
  const metadata =
    row.metadata &&
    typeof row.metadata === "object" &&
    !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  const readString = (...keys: string[]) => {
    for (const key of keys) {
      const value = metadata[key] ?? config[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };
  const workflowKind = readString("workflowKind", "kind", "workflow_kind");
  const gcsBucket = readString("gcsBucket", "gcs_bucket");
  const gcsObject = readString("gcsObject", "gcs_object", "yamlObject");
  const storagePath = readString(
    "storagePath",
    "storage_path",
    "yamlPath",
    "yaml_path",
    "gcsPath",
    "gcs_path",
  );
  return {
    id: row.id,
    name: row.name,
    trigger:
      typeof metadata.trigger === "string"
        ? metadata.trigger
        : typeof config.trigger === "string"
          ? config.trigger
          : row.provider,
    retrievalScope:
      typeof metadata.retrievalScope === "string"
        ? metadata.retrievalScope
        : typeof config.retrievalScope === "string"
          ? config.retrievalScope
          : "기본 범위",
    modelName:
      typeof metadata.modelName === "string"
        ? metadata.modelName
        : typeof config.modelName === "string"
          ? config.modelName
          : "미설정",
    status: row.is_active ? "active" : "review",
    source: storagePath ? ("gcs-yaml" as const) : ("sql" as const),
    workflowKind:
      workflowKind === "router" ||
      workflowKind === "subworkflow" ||
      workflowKind === "monolith" ||
      workflowKind === "managed"
        ? workflowKind
        : storagePath
          ? "managed"
          : undefined,
    storagePath,
    gcsBucket,
    gcsObject,
    sqlSlug: row.slug ?? null,
  };
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseGcsStoragePath(storagePath: string | null) {
  if (!storagePath?.startsWith("gs://")) return null;
  const withoutScheme = storagePath.slice("gs://".length);
  const slashIndex = withoutScheme.indexOf("/");
  if (slashIndex <= 0) return null;
  const bucket = withoutScheme.slice(0, slashIndex).trim();
  const objectPath = withoutScheme.slice(slashIndex + 1).replace(/^\/+/, "");
  return bucket && objectPath
    ? { gcsBucket: bucket, gcsObject: objectPath }
    : null;
}

function asJsonObject(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readJsonString(
  config: Record<string, unknown>,
  metadata: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = metadata[key] ?? config[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

app.get("/workflow-rules/stage-mapping", async (c) => {
  const row = await prisma.system_config.findUnique({
    where: { key: STAGE_MAPPING_KEY },
    select: { value: true, updated_at: true },
  });
  const mapping = row?.value ? sanitizeMapping(row.value) : emptyMapping();
  return c.json({
    mapping,
    source: row?.value ? "db" : "empty",
    updatedAt: row?.updated_at ?? null,
  });
});

app.put("/workflow-rules/stage-mapping", async (c) => {
  const mapping = sanitizeMapping(await c.req.json());
  await prisma.system_config.upsert({
    where: { key: STAGE_MAPPING_KEY },
    create: {
      key: STAGE_MAPPING_KEY,
      value: mapping as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
    update: {
      value: mapping as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
  });
  return c.json({ ok: true, mapping });
});

app.post("/workflow-rules/sync-yaml-catalog", async (c) => {
  const bucket =
    process.env.GCS_WORKFLOW_BUCKET ?? DEFAULT_WORKFLOW_YAML_BUCKET;
  const synced = [];

  for (const entry of WORKFLOW_YAML_DB_CATALOG) {
    const existing = await prisma.workflow_definitions.findUnique({
      where: { slug: entry.slug },
      select: { config: true, metadata: true },
    });
    const existingConfig = asJsonObject(existing?.config);
    const existingMetadata = asJsonObject(existing?.metadata);
    const storedStoragePath = readJsonString(
      existingConfig,
      existingMetadata,
      "storagePath",
      "storage_path",
      "yamlPath",
      "yaml_path",
      "gcsPath",
      "gcs_path",
    );
    const parsedStoredPath = parseGcsStoragePath(storedStoragePath);
    const gcsBucket =
      readJsonString(
        existingConfig,
        existingMetadata,
        "gcsBucket",
        "gcs_bucket",
      ) ??
      parsedStoredPath?.gcsBucket ??
      bucket;
    const gcsObject =
      readJsonString(
        existingConfig,
        existingMetadata,
        "gcsObject",
        "gcs_object",
        "yamlObject",
      ) ??
      parsedStoredPath?.gcsObject ??
      entry.gcsObject;
    const storagePath =
      storedStoragePath ?? buildWorkflowYamlStoragePath(gcsObject, gcsBucket);
    const config = {
      ...existingConfig,
      workflowKind: entry.kind,
      yamlSource: "gcs",
      storagePath,
      gcsBucket,
      gcsObject,
    } satisfies Prisma.InputJsonObject;
    const metadata = {
      ...existingMetadata,
      trigger: entry.trigger,
      retrievalScope: entry.retrievalScope,
      modelName: entry.modelName,
      workflowKind: entry.kind,
      yamlSource: "gcs",
      storagePath,
      gcsBucket,
      gcsObject,
      managedBy: "admin-workflow-yaml-catalog",
    } satisfies Prisma.InputJsonObject;

    const row = await prisma.workflow_definitions.upsert({
      where: { slug: entry.slug },
      create: {
        name: entry.name,
        slug: entry.slug,
        provider: "gcs-yaml",
        status: entry.status === "active" ? "published" : "draft",
        is_active: entry.status === "active",
        config,
        metadata,
      },
      update: {
        name: entry.name,
        provider: "gcs-yaml",
        status: entry.status === "active" ? "published" : "draft",
        is_active: entry.status === "active",
        config,
        metadata,
        updated_at: new Date(),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        provider: true,
        is_active: true,
        metadata: true,
      },
    });
    synced.push(row);
  }

  const adminUserId = c.get("adminUserId");
  if (UUID_PATTERN.test(adminUserId)) {
    await createAdminAuditLog({
      adminUserId,
      targetUserId: null,
      actionType: "workflow_yaml_catalog_sync",
      entityType: "workflow_definitions",
      entityId: null,
      reason: "sync workflow YAML GCS locations into SQL catalog",
      beforePayload: {},
      afterPayload: { count: synced.length, bucket },
    });
  }

  return c.json({ ok: true, bucket, workflowRules: synced });
});

app.patch("/workflow-rules/:ruleId", async (c) => {
  try {
    const ruleId = c.req.param("ruleId");
    const input = (await c.req.json()) as Record<string, unknown>;
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const trigger =
      typeof input.trigger === "string" ? input.trigger.trim() : "";
    const retrievalScope =
      typeof input.retrievalScope === "string"
        ? input.retrievalScope.trim()
        : "";
    const modelName =
      typeof input.modelName === "string" ? input.modelName.trim() : "";
    const status =
      input.status === "active"
        ? "active"
        : input.status === "review"
          ? "review"
          : null;
    const workflowKind =
      input.workflowKind === "router" ||
      input.workflowKind === "subworkflow" ||
      input.workflowKind === "monolith" ||
      input.workflowKind === "managed"
        ? input.workflowKind
        : null;
    const requestedStoragePath = normalizeOptionalString(input.storagePath);
    const requestedGcsBucket = normalizeOptionalString(input.gcsBucket);
    const requestedGcsObject = normalizeOptionalString(input.gcsObject);
    const parsedStoragePath = parseGcsStoragePath(requestedStoragePath);
    const locationPatch: Record<string, string> = {};
    if (workflowKind) {
      locationPatch.workflowKind = workflowKind;
    }
    if (requestedStoragePath || requestedGcsBucket || requestedGcsObject) {
      locationPatch.yamlSource = "gcs";
      if (requestedStoragePath) {
        locationPatch.storagePath = requestedStoragePath;
      }
      const gcsBucket = parsedStoragePath?.gcsBucket ?? requestedGcsBucket;
      const gcsObject = parsedStoragePath?.gcsObject ?? requestedGcsObject;
      if (gcsBucket) {
        locationPatch.gcsBucket = gcsBucket;
      }
      if (gcsObject) {
        locationPatch.gcsObject = gcsObject;
      }
    }
    if (
      !ruleId ||
      !name ||
      !trigger ||
      !retrievalScope ||
      !modelName ||
      !status
    ) {
      return c.json({ error: "invalid workflow payload" }, 400);
    }

    const current = await prisma.workflow_definitions.findUnique({
      where: { id: ruleId },
    });

    if (!current || current.provider === "schift") {
      const updatedWorkflow = (await patchSchiftWorkflow(ruleId, {
        name,
        status: status === "active" ? "published" : "draft",
      })) as { id?: string; name?: string };
      if (current) {
        await prisma.workflow_definitions.update({
          where: { id: ruleId },
          data: {
            name,
            status: status === "active" ? "published" : "draft",
            is_active: status === "active",
            config: {
              ...((current.config as Record<string, unknown>) ?? {}),
              modelName,
              retrievalScope,
              ...locationPatch,
            },
            metadata: {
              ...((current.metadata as Record<string, unknown>) ?? {}),
              trigger,
              retrievalScope,
              modelName,
              ...locationPatch,
            },
            updated_at: new Date(),
          },
        });
      }
      return c.json({
        workflowRule: {
          id: updatedWorkflow.id ?? ruleId,
          name: updatedWorkflow.name ?? name,
          trigger,
          retrievalScope,
          modelName,
          status,
        },
      });
    }

    const updated = await prisma.workflow_definitions.update({
      where: { id: ruleId },
      data: {
        name,
        status: status === "active" ? "published" : "draft",
        is_active: status === "active",
        config: {
          ...((current.config as Record<string, unknown>) ?? {}),
          modelName,
          retrievalScope,
          ...locationPatch,
        },
        metadata: {
          ...((current.metadata as Record<string, unknown>) ?? {}),
          trigger,
          retrievalScope,
          modelName,
          ...locationPatch,
        },
        updated_at: new Date(),
      },
    });
    await createAdminAuditLog({
      adminUserId: c.get("adminUserId"),
      targetUserId: null,
      actionType: "content_update",
      entityType: "workflow_rule",
      entityId: ruleId,
      reason: "workflow_rule_update",
      beforePayload: current
        ? {
            name: current.name,
            provider: current.provider,
            status: current.is_active ? "active" : "review",
          }
        : {},
      afterPayload: {
        name,
        trigger,
        retrieval_scope: retrievalScope,
        model_name: modelName,
        status,
        ...(requestedStoragePath ? { storage_path: requestedStoragePath } : {}),
      },
    });
    return c.json({ workflowRule: mapWorkflowRule(updated) });
  } catch (error) {
    console.error("admin api workflow rule PATCH error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to update workflow rule",
      },
      400,
    );
  }
});

export default app;
