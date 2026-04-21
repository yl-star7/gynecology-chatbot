/**
 * 로컬 YAML 그래프를 읽어 Schift 워크플로우 그래프를 PATCH 로 덮어쓴다.
 * createDefaultInternalAnswerWorkflow()는 DB 를 건드려서 로컬에서 불안정.
 * 이 스크립트는 Schift API 만 사용하므로 DB 없어도 작동.
 *
 * Usage:
 *   pnpm tsx scripts/patch-workflow-graph.ts
 *   WORKFLOW_ID=<id> pnpm tsx scripts/patch-workflow-graph.ts
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { parse as parseYaml } from "yaml";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const WORKFLOW_ID =
  process.env.WORKFLOW_ID ?? "f04f0498ba914399a61251a1cab6876c";
const API_KEY = process.env.SCHIFT_API_KEY!;
const BASE_URL =
  process.env.SCHIFT_API_URL?.replace(/\/$/, "") ?? "https://api.schift.io";
const YAML_PATH = path.resolve(
  process.cwd(),
  "packages/mobile-api/src/workflows/maternal-nursing.yaml",
);

type Block = {
  id: string;
  type: string;
  title?: string;
  config?: Record<string, unknown>;
};

type Edge = {
  source: string;
  target: string;
  source_handle?: string;
  target_handle?: string;
};

type Yaml = {
  prompts: Record<string, string>;
  blocks: Block[];
  edges: Edge[];
};

function substituteTemplateRefs(
  config: Record<string, unknown> | undefined,
  prompts: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config ?? {})) {
    if (typeof v === "string" && v.startsWith("$prompts.")) {
      const key = v.slice("$prompts.".length);
      out[k] = prompts[key] ?? v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function main() {
  const raw = fs.readFileSync(YAML_PATH, "utf-8");
  const wf = parseYaml(raw) as Yaml;

  // Fetch current graph (we need existing node IDs to keep references stable)
  const currentRes = await fetch(`${BASE_URL}/v1/workflows/${WORKFLOW_ID}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!currentRes.ok) {
    throw new Error(`failed to fetch workflow: ${currentRes.status}`);
  }
  const current = (await currentRes.json()) as {
    graph: { nodes?: Block[]; blocks?: Block[]; edges: Edge[] };
  };
  const currentNodes = current.graph.nodes ?? current.graph.blocks ?? [];

  // Map YAML block id (like "retriever") → Schift node UUID if already present,
  // otherwise generate a new short hash.
  const idMap = new Map<string, string>();
  for (const ymlBlock of wf.blocks) {
    const existing = currentNodes.find(
      (n) => n.type === ymlBlock.type && n.title === ymlBlock.title,
    );
    if (existing) {
      idMap.set(ymlBlock.id, existing.id);
    } else {
      // Generate 12 char hex like Schift
      idMap.set(
        ymlBlock.id,
        [...crypto.getRandomValues(new Uint8Array(6))]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
      );
    }
  }

  const nodes = wf.blocks.map((b, i) => ({
    id: idMap.get(b.id)!,
    type: b.type,
    title: b.title,
    position: { x: 100 + i * 200, y: 100 },
    config: substituteTemplateRefs(b.config, wf.prompts),
  }));

  const edges = wf.edges.map((e, i) => ({
    id: (1000000 + i).toString(16),
    source: idMap.get(e.source)!,
    target: idMap.get(e.target)!,
    source_handle: e.source_handle,
    target_handle: e.target_handle,
  }));

  console.log(
    `PATCH ${BASE_URL}/v1/workflows/${WORKFLOW_ID}  nodes=${nodes.length} edges=${edges.length}`,
  );
  for (const n of nodes) {
    console.log(`  [${n.type}] ${n.id}  ${n.title}`);
  }

  const res = await fetch(`${BASE_URL}/v1/workflows/${WORKFLOW_ID}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ graph: { nodes, edges } }),
  });
  console.log(`status: ${res.status}`);
  const body = await res.text();
  console.log(`body: ${body.slice(0, 500)}`);

  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
