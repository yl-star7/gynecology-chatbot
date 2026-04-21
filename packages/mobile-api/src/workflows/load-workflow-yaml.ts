import fs from "node:fs";
import path from "node:path";

import { Storage } from "@google-cloud/storage";
import { parse as parseYaml } from "yaml";

import type { WorkflowGraph } from "@schift-io/sdk";

const STORAGE_BUCKET = "agaya-workflow-config";
const STORAGE_PATH = "maternal-nursing.yaml";
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

function resolveRef(
  value: unknown,
  prompts: Record<string, string>,
  staticResponses: Record<string, Record<string, unknown>>,
): unknown {
  if (typeof value !== "string" || !value.startsWith("$")) {
    return value;
  }

  const refPath = value.slice(1);
  const [section, key] = refPath.split(".");

  if (section === "prompts" && key in prompts) {
    return prompts[key];
  }

  if (section === "static_responses" && key in staticResponses) {
    return staticResponses[key];
  }

  // $env.VAR — process.env 치환 (빌드/동기화 시점)
  if (section === "env" && key) {
    return process.env[key] ?? value;
  }

  // $config.KEY — YAML 상단의 config: 섹션에서 치환
  if (section === "config" && key) {
    const cfg = ((yamlConfigRef.current ?? {}) as Record<string, unknown>)[key];
    return cfg ?? value;
  }

  return value;
}

const yamlConfigRef: { current: Record<string, unknown> | null } = {
  current: null,
};

function resolveConfig(
  config: Record<string, unknown> | undefined,
  prompts: Record<string, string>,
  staticResponses: Record<string, Record<string, unknown>>,
): Record<string, unknown> {
  if (!config) return {};

  const resolved: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    resolved[k] = resolveRef(v, prompts, staticResponses);
  }

  return resolved;
}

function buildResult(yaml: WorkflowYaml) {
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
    adminMetadata: yaml.admin_metadata,
    prompts: yaml.prompts,
    staticResponses: yaml.static_responses,
    graph: { ...graph, nodes: graph.blocks } as WorkflowGraph,
  };
}

// ── GCS에서 로드 ──

let remoteCache: {
  result: ReturnType<typeof buildResult>;
  fetchedAt: number;
} | null = null;

function getGcsProjectId() {
  return (
    process.env.GCS_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || undefined
  );
}

function shouldAttemptGcsRead() {
  return Boolean(
    process.env.GCS_WORKFLOW_BUCKET ||
    process.env.GCS_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

async function fetchFromGcs(): Promise<string | null> {
  if (!shouldAttemptGcsRead()) {
    return null;
  }

  const bucket = process.env.GCS_WORKFLOW_BUCKET ?? STORAGE_BUCKET;

  try {
    const storage = new Storage({ projectId: getGcsProjectId() });
    const [buffer] = await storage.bucket(bucket).file(STORAGE_PATH).download();
    return buffer.toString("utf-8");
  } catch {
    return null;
  }
}

// ── 로컬 파일 fallback ──

function loadLocalYaml(): WorkflowYaml {
  const candidates = [
    path.join(process.cwd(), "src/workflows/maternal-nursing.yaml"),
    path.join(
      process.cwd(),
      "packages/mobile-api/src/workflows/maternal-nursing.yaml",
    ),
    path.join(
      process.cwd(),
      "../../packages/mobile-api/src/workflows/maternal-nursing.yaml",
    ),
    path.join(process.cwd(), "src/lib/mobile/workflows/maternal-nursing.yaml"),
    path.join(
      process.cwd(),
      "apps/web/src/lib/mobile/workflows/maternal-nursing.yaml",
    ),
  ];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) {
    throw new Error(
      `maternal-nursing.yaml not found in: ${candidates.join(", ")}`,
    );
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return parseYaml(raw) as WorkflowYaml;
}

// ── 공개 API ──

export function loadMaternalNursingWorkflow() {
  // 캐시가 유효하면 바로 반환
  if (remoteCache && Date.now() - remoteCache.fetchedAt < CACHE_TTL_MS) {
    return remoteCache.result;
  }

  // 동기 호출이므로 로컬 파일을 기본으로 사용
  const yaml = loadLocalYaml();
  const result = buildResult(yaml);

  // 백그라운드에서 GCS 확인 → 있으면 캐시 갱신
  fetchFromGcs()
    .then((text) => {
      if (text) {
        const remoteYaml = parseYaml(text) as WorkflowYaml;
        remoteCache = {
          result: buildResult(remoteYaml),
          fetchedAt: Date.now(),
        };
      }
    })
    .catch(() => {
      // GCS 접근 실패 시 로컬 파일 유지
    });

  // 캐시가 있으면 원격 버전 반환, 없으면 로컬
  return remoteCache?.result ?? result;
}

/**
 * GCS에서 최신 YAML을 강제로 가져온다.
 * 관리자가 YAML을 업로드한 직후 호출용.
 */
export async function refreshWorkflowFromStorage() {
  const text = await fetchFromGcs();
  if (!text) {
    return null;
  }

  const yaml = parseYaml(text) as WorkflowYaml;
  const result = buildResult(yaml);
  remoteCache = { result, fetchedAt: Date.now() };
  return result;
}
