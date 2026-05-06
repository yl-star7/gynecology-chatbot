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
  ADMIN_WORKFLOW_YAML_CATALOG,
  DEFAULT_WORKFLOW_YAML_BUCKET,
  buildWorkflowYamlStoragePath,
} from "../packages/app-core/src/workflow-yaml-catalog";
import { prisma, type Prisma } from "../packages/db/src/prisma";

const bucket = process.env.GCS_WORKFLOW_BUCKET ?? DEFAULT_WORKFLOW_YAML_BUCKET;

async function main() {
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
