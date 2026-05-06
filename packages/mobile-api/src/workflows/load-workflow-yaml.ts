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
  localPath: string | null;
  loadedAt: string;
  adminMetadata: WorkflowYaml["admin_metadata"];
  prompts: Record<string, string>;
  staticResponses: Record<string, Record<string, unknown>>;
  chatFlow?: unknown | null;
  graph: WorkflowGraph;
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
    "source" | "storageBucket" | "storagePath" | "localPath"
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

async function fetchFromGcs(): Promise<{
  text: string;
  bucket: string;
  path: string;
} | null> {
  if (!shouldAttemptGcsRead()) {
    return null;
  }

  const bucket = process.env.GCS_WORKFLOW_BUCKET ?? STORAGE_BUCKET;

  try {
    const storage = new Storage({ projectId: getGcsProjectId() });
    const [buffer] = await storage.bucket(bucket).file(STORAGE_PATH).download();
    return {
      text: buffer.toString("utf-8"),
      bucket,
      path: STORAGE_PATH,
    };
  } catch {
    return null;
  }
}

// ── 로컬 파일 fallback ──

function loadLocalYaml(): { yaml: WorkflowYaml; filePath: string } {
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
    localPath: local.filePath,
  });
  logWorkflowYamlLoad("load", result);

  // 백그라운드에서 GCS 확인 → 있으면 캐시 갱신
  fetchFromGcs()
    .then((remote) => {
      if (remote) {
        const remoteYaml = parseYaml(remote.text) as WorkflowYaml;
        const remoteResult = buildResult(remoteYaml, {
          source: "gcs-cache",
          storageBucket: remote.bucket,
          storagePath: remote.path,
          localPath: local.filePath,
        });
        remoteCache = {
          result: remoteResult,
          fetchedAt: Date.now(),
        };
        logWorkflowYamlLoad("refresh", remoteResult);
      }
    })
    .catch(() => {
      // GCS 접근 실패 시 로컬 파일 유지
    });

  // 캐시가 있으면 원격 버전 반환, 없으면 로컬
  return remoteCache?.result ?? result;
}

/**
 * 모바일 채팅 런타임용: 캐시가 없으면 GCS를 먼저 확인하고, 실패할 때만
 * 번들된 로컬 YAML로 fallback 한다. 관리자 YAML 수정 후 콜드 스타트 첫 요청도
 * 가능한 한 원격 YAML을 사용하게 하기 위한 비동기 진입점이다.
 */
export async function loadMaternalNursingWorkflowPreferRemote() {
  if (remoteCache && Date.now() - remoteCache.fetchedAt < CACHE_TTL_MS) {
    logWorkflowYamlLoad("load", remoteCache.result);
    return remoteCache.result;
  }

  const remote = await fetchFromGcs();
  if (remote) {
    const remoteYaml = parseYaml(remote.text) as WorkflowYaml;
    const result = buildResult(remoteYaml, {
      source: "gcs-refresh",
      storageBucket: remote.bucket,
      storagePath: remote.path,
      localPath: null,
    });
    remoteCache = {
      result: buildResult(remoteYaml, {
        source: "gcs-cache",
        storageBucket: remote.bucket,
        storagePath: remote.path,
        localPath: null,
      }),
      fetchedAt: Date.now(),
    };
    logWorkflowYamlLoad("refresh", result);
    return result;
  }

  return loadMaternalNursingWorkflow();
}

/**
 * GCS에서 최신 YAML을 강제로 가져온다.
 * 관리자가 YAML을 업로드한 직후 호출용.
 */
export async function refreshWorkflowFromStorage() {
  const remote = await fetchFromGcs();
  if (!remote) {
    return null;
  }

  const yaml = parseYaml(remote.text) as WorkflowYaml;
  const result = buildResult(yaml, {
    source: "gcs-refresh",
    storageBucket: remote.bucket,
    storagePath: remote.path,
    localPath: null,
  });
  remoteCache = { result, fetchedAt: Date.now() };
  logWorkflowYamlLoad("refresh", result);
  return result;
}
