/**
 * Upsert the admin workflow YAML catalog into public.workflow_definitions.
 *
 * The runtime YAML lives in GCS. SQL should keep the admin-facing registry:
 * workflow slug/name/status plus the GCS object path for each YAML.
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import {
  DEFAULT_WORKFLOW_YAML_BUCKET,
  WORKFLOW_YAML_DB_CATALOG,
  buildWorkflowYamlStoragePath,
} from "../packages/app-core/src/workflow-yaml-catalog";
import { prisma, type Prisma } from "../packages/db/src/prisma";

const bucket = process.env.GCS_WORKFLOW_BUCKET ?? DEFAULT_WORKFLOW_YAML_BUCKET;

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

function parseGcsStoragePath(storagePath: string | null) {
  if (!storagePath?.startsWith("gs://")) return null;
  const withoutScheme = storagePath.slice("gs://".length);
  const slashIndex = withoutScheme.indexOf("/");
  if (slashIndex <= 0) return null;
  const gcsBucket = withoutScheme.slice(0, slashIndex).trim();
  const gcsObject = withoutScheme.slice(slashIndex + 1).replace(/^\/+/, "");
  return gcsBucket && gcsObject ? { gcsBucket, gcsObject } : null;
}

async function main() {
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

    await prisma.workflow_definitions.upsert({
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
    });

    console.log(`[workflow-yaml] ${entry.slug} -> ${storagePath}`);
  }
}

main()
  .catch((error) => {
    console.error("[workflow-yaml] sync failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
