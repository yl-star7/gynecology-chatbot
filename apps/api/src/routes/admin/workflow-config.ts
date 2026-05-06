import { Hono } from "hono";
import {
  ADMIN_WORKFLOW_YAML_CATALOG,
  DEFAULT_WORKFLOW_YAML_BUCKET,
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

function defaultsFromEnv(): Mapping {
  return {
    baby_info: process.env.SCHIFT_WF_BABY_INFO ?? null,
    letter_reflection: process.env.SCHIFT_WF_LETTER_REFLECTION ?? null,
    free_chat: process.env.SCHIFT_WF_FREE_CHAT ?? null,
    general: process.env.SCHIFT_WF_GENERAL ?? null,
    router: process.env.SCHIFT_WF_ROUTER ?? null,
  };
}

function sanitizeMapping(input: unknown): Mapping {
  const defaults = defaultsFromEnv();
  if (!input || typeof input !== "object" || Array.isArray(input))
    return defaults;
  const obj = input as Record<string, unknown>;
  const pick = (key: keyof Mapping): string | null => {
    const value = obj[key];
    return typeof value === "string" && value.trim()
      ? value.trim()
      : (defaults[key] ?? null);
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
  };
}

app.get("/workflow-rules/stage-mapping", async (c) => {
  const row = await prisma.system_config.findUnique({
    where: { key: STAGE_MAPPING_KEY },
    select: { value: true, updated_at: true },
  });
  const mapping = row?.value ? sanitizeMapping(row.value) : defaultsFromEnv();
  return c.json({
    mapping,
    source: row?.value ? "db" : "env",
    updatedAt: row?.updated_at ?? null,
    envDefaults: defaultsFromEnv(),
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

  for (const entry of ADMIN_WORKFLOW_YAML_CATALOG) {
    const storagePath = buildWorkflowYamlStoragePath(entry.gcsObject, bucket);
    const config = {
      workflowKind: entry.kind,
      yamlSource: "gcs",
      storagePath,
      gcsBucket: bucket,
      gcsObject: entry.gcsObject,
    } satisfies Prisma.InputJsonObject;
    const metadata = {
      trigger: entry.trigger,
      retrievalScope: entry.retrievalScope,
      modelName: entry.modelName,
      workflowKind: entry.kind,
      yamlSource: "gcs",
      storagePath,
      gcsBucket: bucket,
      gcsObject: entry.gcsObject,
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
            },
            metadata: {
              ...((current.metadata as Record<string, unknown>) ?? {}),
              trigger,
              retrievalScope,
              modelName,
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
        },
        metadata: {
          ...((current.metadata as Record<string, unknown>) ?? {}),
          trigger,
          retrievalScope,
          modelName,
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
