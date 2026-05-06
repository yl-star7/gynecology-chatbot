import { createHash } from "node:crypto";

import {
  WORKFLOW_YAML_DB_CATALOG,
  buildWorkflowYamlStoragePath,
} from "@gynecology-chatbot/app-core";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";

export type AdminYamlWorkflowName =
  | "monolith"
  | "router"
  | "baby-info"
  | "letter-reflection"
  | "free-chat"
  | "general";

export type AdminWorkflowYamlLocation = {
  routeName: AdminYamlWorkflowName;
  slug: string;
  bucket: string;
  objectPath: string;
  storagePath: string;
  rowId: string;
};

export const WORKFLOW_STAGE_MAPPING_BY_NAME: Record<
  AdminYamlWorkflowName,
  { mappingKey: string | null }
> = {
  monolith: { mappingKey: null },
  router: { mappingKey: "router" },
  "baby-info": { mappingKey: "baby_info" },
  "letter-reflection": { mappingKey: "letter_reflection" },
  "free-chat": { mappingKey: "free_chat" },
  general: { mappingKey: "general" },
};

function routeNameFromSlug(slug: string): AdminYamlWorkflowName | null {
  const suffix = slug.replace(/^maternal-nursing-/, "");
  return suffix === "monolith" ||
    suffix === "router" ||
    suffix === "baby-info" ||
    suffix === "letter-reflection" ||
    suffix === "free-chat" ||
    suffix === "general"
    ? suffix
    : null;
}

const workflowDescriptors = WORKFLOW_YAML_DB_CATALOG.map((entry) => ({
  ...entry,
  routeName: routeNameFromSlug(entry.slug),
})).filter(
  (entry): entry is (typeof WORKFLOW_YAML_DB_CATALOG)[number] & {
    routeName: AdminYamlWorkflowName;
  } => Boolean(entry.routeName),
);

export function resolveAdminYamlWorkflowName(
  nameOrSlug: string | null | undefined,
) {
  if (!nameOrSlug) return null;
  const value = nameOrSlug.trim();
  return (
    workflowDescriptors.find(
      (descriptor) =>
        descriptor.routeName === value || descriptor.slug === value,
    ) ?? null
  );
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(
  metadata: Record<string, unknown>,
  config: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = metadata[key] ?? config[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeObjectPath(value: string) {
  return value.replace(/^\/+/, "").trim();
}

function parseStorageLocation(input: {
  storagePath: string | null;
  gcsBucket: string | null;
  gcsObject: string | null;
}) {
  if (input.storagePath?.startsWith("gs://")) {
    const withoutScheme = input.storagePath.slice("gs://".length);
    const slashIndex = withoutScheme.indexOf("/");
    if (slashIndex > 0) {
      const bucket = withoutScheme.slice(0, slashIndex).trim();
      const objectPath = normalizeObjectPath(
        withoutScheme.slice(slashIndex + 1),
      );
      if (bucket && objectPath) {
        return {
          bucket,
          objectPath,
          storagePath: buildWorkflowYamlStoragePath(objectPath, bucket),
        };
      }
    }
  }

  const bucket = input.gcsBucket?.trim();
  const objectPath = normalizeObjectPath(
    input.gcsObject ?? input.storagePath ?? "",
  );
  if (!bucket || !objectPath || objectPath.startsWith("http")) return null;

  return {
    bucket,
    objectPath,
    storagePath: buildWorkflowYamlStoragePath(objectPath, bucket),
  };
}

function parseRowLocation(row: {
  config: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
}) {
  const config = asRecord(row.config);
  const metadata = asRecord(row.metadata);
  return parseStorageLocation({
    storagePath: readString(metadata, config, [
      "storagePath",
      "storage_path",
      "yamlPath",
      "yaml_path",
      "gcsPath",
      "gcs_path",
    ]),
    gcsBucket: readString(metadata, config, ["gcsBucket", "gcs_bucket"]),
    gcsObject: readString(metadata, config, [
      "gcsObject",
      "gcs_object",
      "yamlObject",
      "yaml_object",
    ]),
  });
}

export async function resolveAdminWorkflowYamlLocation(
  nameOrSlug: string,
): Promise<AdminWorkflowYamlLocation | null> {
  const descriptor = resolveAdminYamlWorkflowName(nameOrSlug);
  if (!descriptor) return null;

  const row = await prisma.workflow_definitions.findFirst({
    where: {
      provider: "gcs-yaml",
      slug: descriptor.slug,
    },
    select: {
      id: true,
      config: true,
      metadata: true,
    },
  });
  if (!row) return null;

  const parsed = parseRowLocation(row);
  if (!parsed) return null;

  return {
    routeName: descriptor.routeName,
    slug: descriptor.slug,
    bucket: parsed.bucket,
    objectPath: parsed.objectPath,
    storagePath: parsed.storagePath,
    rowId: row.id,
  };
}

export async function recordAdminWorkflowYamlSave(
  location: AdminWorkflowYamlLocation,
  yamlText: string,
) {
  const row = await prisma.workflow_definitions.findUnique({
    where: { id: location.rowId },
    select: { config: true, metadata: true },
  });
  if (!row) return;

  const now = new Date();
  const yamlSha = createHash("sha256").update(yamlText).digest("hex");
  const locationPatch = {
    workflowKind:
      WORKFLOW_YAML_DB_CATALOG.find((entry) => entry.slug === location.slug)
        ?.kind ?? location.routeName,
    yamlSource: "gcs",
    storagePath: location.storagePath,
    gcsBucket: location.bucket,
    gcsObject: location.objectPath,
    yamlSha,
    version: yamlSha,
    yamlUpdatedAt: now.toISOString(),
  } satisfies Prisma.InputJsonObject;

  await prisma.workflow_definitions.update({
    where: { id: location.rowId },
    data: {
      config: {
        ...asRecord(row.config),
        workflowKind: locationPatch.workflowKind,
        yamlSource: locationPatch.yamlSource,
        storagePath: locationPatch.storagePath,
        gcsBucket: locationPatch.gcsBucket,
        gcsObject: locationPatch.gcsObject,
      },
      metadata: {
        ...asRecord(row.metadata),
        ...locationPatch,
      },
      updated_at: now,
    },
  });
}
