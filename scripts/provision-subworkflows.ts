/**
 * stage별 subworkflow 4개를 Schift 에 create/sync 하고 workflow ID 출력.
 *
 * Usage:
 *   pnpm tsx scripts/provision-subworkflows.ts
 *   (기존 워크플로우 이름과 매칭되면 upsert, 없으면 create)
 *
 * 출력된 ID 들을 .env.local 에 저장:
 *   SCHIFT_WF_BABY_INFO=...
 *   SCHIFT_WF_LETTER_REFLECTION=...
 *   SCHIFT_WF_FREE_CHAT=...
 *   SCHIFT_WF_GENERAL=...
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { parse as parseYaml } from "yaml";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

const SUBWORKFLOW_FILES = [
  {
    key: "SCHIFT_WF_BABY_INFO",
    path: "packages/mobile-api/src/workflows/subworkflows/baby-info.yaml",
  },
  {
    key: "SCHIFT_WF_LETTER_REFLECTION",
    path: "packages/mobile-api/src/workflows/subworkflows/letter-reflection.yaml",
  },
  {
    key: "SCHIFT_WF_FREE_CHAT",
    path: "packages/mobile-api/src/workflows/subworkflows/free-chat.yaml",
  },
  {
    key: "SCHIFT_WF_GENERAL",
    path: "packages/mobile-api/src/workflows/subworkflows/general.yaml",
  },
];

type Yaml = {
  name: string;
  description: string;
  prompts?: Record<string, string>;
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

function resolvePromptRefs(
  config: Record<string, unknown> | undefined,
  prompts: Record<string, string>,
): Record<string, unknown> {
  if (!config) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (typeof v === "string" && v.startsWith("$prompts.")) {
      const key = v.slice("$prompts.".length);
      out[k] = prompts[key] ?? v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function provision(
  schift: Schift,
  yamlPath: string,
): Promise<{ id: string; name: string }> {
  const raw = fs.readFileSync(path.resolve(process.cwd(), yamlPath), "utf-8");
  const wf = parseYaml(raw) as Yaml;

  // 기존 같은 name의 workflow 검색 (SDK list 가 undefined 리턴하는 버그 대응)
  const existingListRaw = (await schift.workflows.list()) as unknown;
  const existingList: Array<{ id: string; name: string; status?: string }> =
    Array.isArray(existingListRaw)
      ? (existingListRaw as Array<{
          id: string;
          name: string;
          status?: string;
        }>)
      : [];
  const existing = existingList.find(
    (w) => w.name === wf.name && w.status !== "archived",
  );

  let workflowId: string;
  if (existing) {
    workflowId = existing.id;
    console.log(`  [upsert] ${wf.name} → ${workflowId}`);
    // 기존 그래프 blocks 모두 제거
    const current = (await schift.workflows.get(workflowId)) as {
      graph: { nodes?: Array<{ id: string }>; blocks?: Array<{ id: string }> };
    };
    const currentNodes = current.graph.nodes ?? current.graph.blocks ?? [];
    for (const n of currentNodes) {
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
    console.log(`  [create] ${wf.name} → ${workflowId}`);
  }

  // blocks + edges 추가
  const blockIdMap = new Map<string, string>();
  const prompts = wf.prompts ?? {};
  for (const b of wf.blocks) {
    const added = (await schift.workflows.addBlock(workflowId, {
      type: b.type,
      title: b.title ?? b.id,
      config: resolvePromptRefs(b.config, prompts),
    })) as { id: string };
    blockIdMap.set(b.id, added.id);
  }
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

  return { id: workflowId, name: wf.name };
}

async function main() {
  const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });
  console.log("Provisioning subworkflows...\n");
  const results: Array<{ key: string; id: string; name: string }> = [];
  for (const { key, path: p } of SUBWORKFLOW_FILES) {
    const { id, name } = await provision(schift, p);
    results.push({ key, id, name });
  }
  console.log("\n\n=== .env 에 추가할 값 ===");
  for (const r of results) {
    console.log(`${r.key}=${r.id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
