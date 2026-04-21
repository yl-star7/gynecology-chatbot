/**
 * Parent router workflow 를 Schift 에 provision.
 * maternal-nursing-router.yaml 을 읽어 Schift 에 create/upsert.
 *
 * 사전 조건: subworkflow 4개 ID 가 .env.local 에 설정돼 있어야 함
 *   SCHIFT_WF_BABY_INFO, SCHIFT_WF_LETTER_REFLECTION,
 *   SCHIFT_WF_FREE_CHAT, SCHIFT_WF_GENERAL
 *
 * 출력: SCHIFT_WF_ROUTER=<id>
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { parse as parseYaml } from "yaml";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

const ROUTER_YAML =
  "packages/mobile-api/src/workflows/maternal-nursing-router.yaml";

type Yaml = {
  name: string;
  description: string;
  config?: Record<string, unknown>;
  blocks: Array<{
    id: string;
    type: string;
    title?: string;
    config?: Record<string, unknown>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    source_handle?: string;
    target_handle?: string;
  }>;
};

function resolveValue(value: unknown, cfg: Record<string, unknown>): unknown {
  if (typeof value !== "string") return value;
  // $config.KEY — YAML config 에서 치환 (재귀)
  if (value.startsWith("$config.")) {
    const key = value.slice("$config.".length);
    const next = cfg[key];
    if (next === undefined) return value;
    return resolveValue(next, cfg);
  }
  // $env.VAR — process.env
  if (value.startsWith("$env.")) {
    const key = value.slice("$env.".length);
    return process.env[key] ?? value;
  }
  // 인라인 $env.X 치환
  const re = /\$(config|env)\.([A-Za-z_][A-Za-z0-9_]*)/g;
  if (re.test(value)) {
    return value.replace(re, (_m, s: string, k: string) => {
      if (s === "env") return process.env[k] ?? "";
      if (s === "config") {
        const v = cfg[k];
        return typeof v === "string"
          ? (resolveValue(v, cfg) as string)
          : String(v ?? "");
      }
      return "";
    });
  }
  return value;
}

function resolveDeep(obj: unknown, cfg: Record<string, unknown>): unknown {
  if (Array.isArray(obj)) return obj.map((x) => resolveDeep(x, cfg));
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = resolveDeep(v, cfg);
    }
    return out;
  }
  return resolveValue(obj, cfg);
}

async function main() {
  const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });
  const raw = fs.readFileSync(
    path.resolve(process.cwd(), ROUTER_YAML),
    "utf-8",
  );
  const wf = parseYaml(raw) as Yaml;
  const cfg = wf.config ?? {};

  // 기존 router 검색 (같은 이름)
  const listRaw = (await schift.workflows.list()) as unknown;
  const list: Array<{ id: string; name: string; status?: string }> =
    Array.isArray(listRaw)
      ? (listRaw as Array<{ id: string; name: string; status?: string }>)
      : [];
  const existing = list.find(
    (w) => w.name === wf.name && w.status !== "archived",
  );

  let workflowId: string;
  if (existing) {
    workflowId = existing.id;
    console.log(`[upsert] ${wf.name} → ${workflowId}`);
    const current = (await schift.workflows.get(workflowId)) as {
      graph: { nodes?: Array<{ id: string }>; blocks?: Array<{ id: string }> };
    };
    const nodes = current.graph.nodes ?? current.graph.blocks ?? [];
    for (const n of nodes) {
      try {
        await schift.workflows.removeBlock(workflowId, n.id);
      } catch {
        // ignore
      }
    }
  } else {
    const created = (await schift.workflows.create({
      name: wf.name,
      description: wf.description,
    })) as { id: string };
    workflowId = created.id;
    console.log(`[create] ${wf.name} → ${workflowId}`);
  }

  // blocks add with $config / $env resolved
  const blockIdMap = new Map<string, string>();
  for (const b of wf.blocks) {
    const resolvedCfg = resolveDeep(b.config ?? {}, cfg) as Record<
      string,
      unknown
    >;
    const added = (await schift.workflows.addBlock(workflowId, {
      type: b.type,
      title: b.title ?? b.id,
      config: resolvedCfg,
    })) as { id: string };
    blockIdMap.set(b.id, added.id);
    console.log(`  + block [${b.type}] ${b.id} → ${added.id}`);
  }

  // edges
  for (const e of wf.edges) {
    await schift.workflows.addEdge(workflowId, {
      source: blockIdMap.get(e.source) ?? e.source,
      target: blockIdMap.get(e.target) ?? e.target,
      source_handle: e.source_handle ?? "out",
      target_handle: e.target_handle ?? "in",
    });
  }

  // publish
  await (
    schift as unknown as {
      workflows: {
        update: (id: string, body: Record<string, unknown>) => Promise<unknown>;
      };
    }
  ).workflows.update(workflowId, { status: "published" });

  console.log("\n=== .env 에 추가 ===");
  console.log(`SCHIFT_WF_ROUTER=${workflowId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
