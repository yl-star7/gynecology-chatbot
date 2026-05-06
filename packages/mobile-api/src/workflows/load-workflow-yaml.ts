import fs from "node:fs";
import path from "node:path";

import { Storage } from "@google-cloud/storage";
import { parse as parseYaml } from "yaml";

import { RUNTIME_WORKFLOW_YAML_ENTRY } from "@gynecology-chatbot/app-core";
import { prisma, type Prisma } from "@gynecology-chatbot/db/prisma";
import type { WorkflowGraph } from "@schift-io/sdk";

const STORAGE_PATH = RUNTIME_WORKFLOW_YAML_ENTRY.gcsObject;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

interface WorkflowYaml {
  version?: number;
  name: string;
  description: string;
  admin_metadata: {
    trigger: string;
    retrieval_scope: string;
    model_name: string;
  };
  prompts: Record<string, string>;
  static_responses: Record<string, Record<string, unknown>>;
  chat_flow?: unknown;
  blocks: Array<{
    id: string;
    type: string;
    title: string;
    config?: Record<string, unknown>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    source_handle?: string;
    target_handle?: string;
  }>;
}

export type LoadedMaternalNursingWorkflow = {
  version?: number;
  name: string;
  description: string;
  source: "local" | "gcs-cache" | "gcs-refresh";
  storageBucket: string | null;
  storagePath: string;
  locationSource: "db" | null;
  locationRowId: string | null;
  locationSlug: string | null;
  locationUpdatedAt: string | null;
  localPath: string | null;
  loadedAt: string;
  adminMetadata: WorkflowYaml["admin_metadata"];
  prompts: Record<string, string>;
  staticResponses: Record<string, Record<string, unknown>>;
  chatFlow?: unknown | null;
  graph: WorkflowGraph;
};

export type WorkflowYamlStorageLocation = {
  bucket: string;
  path: string;
  storagePath: string;
  locationSource: "db";
  rowId?: string | null;
  slug?: string | null;
  updatedAt?: string | null;
};

export type WorkflowYamlLocationRow = {
  id: string;
  slug: string | null;
  config: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  updated_at?: Date | string | null;
};

function resolveRef(
  value: unknown,
  prompts: Record<string, string>,
  staticResponses: Record<string, Record<string, unknown>>,
): unknown {
  if (typeof value !== "string") {
    return value;
  }

  // 문자열 시작이 $ref 인 경우: 전체 값을 해당 ref 로 치환 (object/array 가능)
  if (value.startsWith("$") && !value.includes(" ")) {
    const refPath = value.slice(1);
    const [section, key] = refPath.split(".");

    if (section === "prompts" && key in prompts) {
      return prompts[key];
    }
    if (section === "static_responses" && key in staticResponses) {
      return staticResponses[key];
    }
    if (section === "env" && key) {
      return process.env[key] ?? value;
    }
    if (section === "config" && key) {
      const cfg = ((yamlConfigRef.current ?? {}) as Record<string, unknown>)[
        key
      ];
      if (cfg === undefined) return value;
      if (typeof cfg === "string" && cfg.startsWith("$")) {
        return resolveRef(cfg, prompts, staticResponses);
      }
      return cfg;
    }
  }

  // 문자열 안에 $config.X / $env.X 가 인라인으로 있으면 부분 치환
  const interpolationPattern = /\$(config|env)\.([A-Za-z_][A-Za-z0-9_]*)/g;
  if (interpolationPattern.test(value)) {
    return value.replace(
      interpolationPattern,
      (_match, section: string, key: string) => {
        if (section === "env") {
          return process.env[key] ?? "";
        }
        if (section === "config") {
          const cfg = (
            (yamlConfigRef.current ?? {}) as Record<string, unknown>
          )[key];
          if (cfg === undefined) return "";
          if (typeof cfg === "string" && cfg.startsWith("$")) {
            const resolved = resolveRef(cfg, prompts, staticResponses);
            return typeof resolved === "string" ? resolved : "";
          }
          return typeof cfg === "string" ? cfg : String(cfg);
        }
        return "";
      },
    );
  }

  return value;
}

const yamlConfigRef: { current: Record<string, unknown> | null } = {
  current: null,
};

function resolveDeep(
  value: unknown,
  prompts: Record<string, string>,
  staticResponses: Record<string, Record<string, unknown>>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveDeep(item, prompts, staticResponses));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveDeep(v, prompts, staticResponses);
    }
    return out;
  }
  return resolveRef(value, prompts, staticResponses);
}

function resolveConfig(
  config: Record<string, unknown> | undefined,
  prompts: Record<string, string>,
  staticResponses: Record<string, Record<string, unknown>>,
): Record<string, unknown> {
  if (!config) return {};
  return resolveDeep(config, prompts, staticResponses) as Record<
    string,
    unknown
  >;
}

function buildResult(
  yaml: WorkflowYaml,
  metadata: Pick<
    LoadedMaternalNursingWorkflow,
    | "source"
    | "storageBucket"
    | "storagePath"
    | "locationSource"
    | "locationRowId"
    | "locationSlug"
    | "locationUpdatedAt"
    | "localPath"
  >,
): LoadedMaternalNursingWorkflow {
  yamlConfigRef.current =
    (yaml as unknown as { config?: Record<string, unknown> }).config ?? null;
  const graph: WorkflowGraph = {
    blocks: yaml.blocks.map((block, index) => ({
      id: block.id,
      type: block.type as WorkflowGraph["blocks"][number]["type"],
      title: block.title,
      position: { x: 100 + index * 200, y: 100 },
      config: resolveConfig(block.config, yaml.prompts, yaml.static_responses),
    })),
    edges: yaml.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      source_handle: edge.source_handle,
      target_handle: edge.target_handle,
    })),
  };

  return {
    version: yaml.version,
    name: yaml.name,
    description: yaml.description,
    source: metadata.source,
    storageBucket: metadata.storageBucket,
    storagePath: metadata.storagePath,
    locationSource: metadata.locationSource,
    locationRowId: metadata.locationRowId,
    locationSlug: metadata.locationSlug,
    locationUpdatedAt: metadata.locationUpdatedAt,
    localPath: metadata.localPath,
    loadedAt: new Date().toISOString(),
    adminMetadata: yaml.admin_metadata,
    prompts: yaml.prompts,
    staticResponses: yaml.static_responses,
    chatFlow: yaml.chat_flow ?? null,
    graph: { ...graph, nodes: graph.blocks } as WorkflowGraph,
  };
}

// ── GCS에서 로드 ──

let remoteCache: {
  result: ReturnType<typeof buildResult>;
  fetchedAt: number;
  locationKey: string;
} | null = null;

function asRecord(value: unknown): Record<string, unknown> {
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
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function normalizeObjectPath(value: string) {
  return value.replace(/^\/+/, "").trim();
}

function buildStoragePath(bucket: string, objectPath: string) {
  return `gs://${bucket}/${normalizeObjectPath(objectPath)}`;
}

function parseStorageLocation(
  storagePath: string | null,
  gcsBucket: string | null,
  gcsObject: string | null,
): Pick<WorkflowYamlStorageLocation, "bucket" | "path" | "storagePath"> | null {
  if (storagePath?.startsWith("gs://")) {
    const withoutScheme = storagePath.slice("gs://".length);
    const slashIndex = withoutScheme.indexOf("/");
    if (slashIndex > 0) {
      const bucket = withoutScheme.slice(0, slashIndex).trim();
      const objectPath = normalizeObjectPath(
        withoutScheme.slice(slashIndex + 1),
      );
      if (bucket && objectPath) {
        return {
          bucket,
          path: objectPath,
          storagePath: buildStoragePath(bucket, objectPath),
        };
      }
    }
  }

  const bucket = gcsBucket?.trim();
  const objectPath = normalizeObjectPath(gcsObject ?? storagePath ?? "");
  if (!bucket || !objectPath || objectPath.startsWith("http")) {
    return null;
  }

  return {
    bucket,
    path: objectPath,
    storagePath: buildStoragePath(bucket, objectPath),
  };
}

export function resolveWorkflowYamlLocationFromRows(
  rows: WorkflowYamlLocationRow[],
): WorkflowYamlStorageLocation | null {
  const ranked = rows
    .filter((row) => row.slug === RUNTIME_WORKFLOW_YAML_ENTRY.slug)
    .map((row): WorkflowYamlStorageLocation | null => {
      const config = asRecord(row.config);
      const metadata = asRecord(row.metadata);
      const parsed = parseStorageLocation(
        readString(metadata, config, [
          "storagePath",
          "storage_path",
          "yamlPath",
          "yaml_path",
          "gcsPath",
          "gcs_path",
        ]),
        readString(metadata, config, ["gcsBucket", "gcs_bucket"]),
        readString(metadata, config, [
          "gcsObject",
          "gcs_object",
          "yamlObject",
          "yaml_object",
        ]),
      );
      if (!parsed) return null;
      return {
        ...parsed,
        locationSource: "db" as const,
        rowId: row.id,
        slug: row.slug,
        updatedAt:
          row.updated_at instanceof Date
            ? row.updated_at.toISOString()
            : (row.updated_at ?? null),
      };
    })
    .filter((location): location is WorkflowYamlStorageLocation =>
      Boolean(location),
    );

  return ranked[0] ?? null;
}

async function resolveWorkflowYamlLocationFromDb() {
  try {
    const rows = await prisma.workflow_definitions.findMany({
      where: {
        provider: "gcs-yaml",
        slug: RUNTIME_WORKFLOW_YAML_ENTRY.slug,
        is_active: true,
      },
      select: {
        id: true,
        slug: true,
        config: true,
        metadata: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: "desc",
      },
    });
    return resolveWorkflowYamlLocationFromRows(rows);
  } catch (error) {
    console.warn(
      "[mobile-chat-yaml] event=db_location_lookup_failed",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function getLocationKey(location: WorkflowYamlStorageLocation) {
  return [
    location.bucket,
    location.path,
    location.locationSource,
    location.rowId ?? "-",
    location.updatedAt ?? "-",
  ].join("::");
}

function getGcsProjectId() {
  return (
    process.env.GCS_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || undefined
  );
}

async function fetchFromGcs(location: WorkflowYamlStorageLocation): Promise<{
  text: string;
  bucket: string;
  path: string;
  location: WorkflowYamlStorageLocation;
} | null> {
  try {
    const storage = new Storage({ projectId: getGcsProjectId() });
    const [buffer] = await storage
      .bucket(location.bucket)
      .file(location.path)
      .download();
    return {
      text: buffer.toString("utf-8"),
      bucket: location.bucket,
      path: location.path,
      location,
    };
  } catch {
    return null;
  }
}

// ── 로컬 YAML 로더 ──

function loadLocalYaml(): { yaml: WorkflowYaml; filePath: string } {
  const candidates = [
    path.join(process.cwd(), "src/workflows", STORAGE_PATH),
    path.join(process.cwd(), "packages/mobile-api/src/workflows", STORAGE_PATH),
    path.join(
      process.cwd(),
      "../../packages/mobile-api/src/workflows",
      STORAGE_PATH,
    ),
    path.join(process.cwd(), "src/lib/mobile/workflows", STORAGE_PATH),
    path.join(process.cwd(), "apps/web/src/lib/mobile/workflows", STORAGE_PATH),
  ];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) {
    throw new Error(`${STORAGE_PATH} not found in: ${candidates.join(", ")}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return {
    yaml: parseYaml(raw) as WorkflowYaml,
    filePath,
  };
}

function logWorkflowYamlLoad(
  event: "load" | "refresh",
  workflow: LoadedMaternalNursingWorkflow,
) {
  console.info(
    [
      "[mobile-chat-yaml]",
      `event=${event}`,
      `source=${workflow.source}`,
      `version=${workflow.version ?? "unknown"}`,
      `name=${workflow.name}`,
      `storage=${workflow.storageBucket ?? "-"}:${workflow.storagePath}`,
      `locationSource=${workflow.locationSource ?? "-"}`,
      `locationRow=${workflow.locationSlug ?? workflow.locationRowId ?? "-"}`,
      `locationUpdatedAt=${workflow.locationUpdatedAt ?? "-"}`,
      `local=${workflow.localPath ?? "-"}`,
      `blocks=${workflow.graph.blocks.length}`,
    ].join(" "),
  );
}

// ── 공개 API ──

export function loadMaternalNursingWorkflow() {
  // 캐시가 유효하면 바로 반환
  if (remoteCache && Date.now() - remoteCache.fetchedAt < CACHE_TTL_MS) {
    logWorkflowYamlLoad("load", remoteCache.result);
    return remoteCache.result;
  }

  // 동기 호출이므로 로컬 파일을 기본으로 사용
  const local = loadLocalYaml();
  const result = buildResult(local.yaml, {
    source: "local",
    storageBucket: null,
    storagePath: STORAGE_PATH,
    locationSource: null,
    locationRowId: null,
    locationSlug: null,
    locationUpdatedAt: null,
    localPath: local.filePath,
  });
  logWorkflowYamlLoad("load", result);

  return remoteCache?.result ?? result;
}

/**
 * 모바일 채팅 런타임용: DB row가 가리키는 GCS YAML만 사용한다.
 */
export async function loadMaternalNursingWorkflowPreferRemote() {
  const dbLocation = await resolveWorkflowYamlLocationFromDb();
  if (!dbLocation) {
    throw new Error("runtime workflow YAML location is not configured in DB");
  }
  const expectedLocationKey = getLocationKey(dbLocation);

  if (
    remoteCache &&
    remoteCache.locationKey === expectedLocationKey &&
    Date.now() - remoteCache.fetchedAt < CACHE_TTL_MS
  ) {
    logWorkflowYamlLoad("load", remoteCache.result);
    return remoteCache.result;
  }

  const remote = await fetchFromGcs(dbLocation);
  if (remote) {
    const remoteYaml = parseYaml(remote.text) as WorkflowYaml;
    const result = buildResult(remoteYaml, {
      source: "gcs-refresh",
      storageBucket: remote.bucket,
      storagePath: remote.path,
      locationSource: remote.location.locationSource,
      locationRowId: remote.location.rowId ?? null,
      locationSlug: remote.location.slug ?? null,
      locationUpdatedAt: remote.location.updatedAt ?? null,
      localPath: null,
    });
    remoteCache = {
      result: buildResult(remoteYaml, {
        source: "gcs-cache",
        storageBucket: remote.bucket,
        storagePath: remote.path,
        locationSource: remote.location.locationSource,
        locationRowId: remote.location.rowId ?? null,
        locationSlug: remote.location.slug ?? null,
        locationUpdatedAt: remote.location.updatedAt ?? null,
        localPath: null,
      }),
      fetchedAt: Date.now(),
      locationKey: getLocationKey(remote.location),
    };
    logWorkflowYamlLoad("refresh", result);
    return result;
  }

  throw new Error(`runtime workflow YAML could not be read: ${dbLocation.storagePath}`);
}

/**
 * GCS에서 최신 YAML을 강제로 가져온다.
 * 관리자가 YAML을 업로드한 직후 호출용.
 */
export async function refreshWorkflowFromStorage() {
  const dbLocation = await resolveWorkflowYamlLocationFromDb();
  if (!dbLocation) {
    return null;
  }
  const remote = await fetchFromGcs(dbLocation);
  if (!remote) {
    return null;
  }

  const yaml = parseYaml(remote.text) as WorkflowYaml;
  const result = buildResult(yaml, {
    source: "gcs-refresh",
    storageBucket: remote.bucket,
    storagePath: remote.path,
    locationSource: remote.location.locationSource,
    locationRowId: remote.location.rowId ?? null,
    locationSlug: remote.location.slug ?? null,
    locationUpdatedAt: remote.location.updatedAt ?? null,
    localPath: null,
  });
  remoteCache = {
    result,
    fetchedAt: Date.now(),
    locationKey: getLocationKey(remote.location),
  };
  logWorkflowYamlLoad("refresh", result);
  return result;
}
