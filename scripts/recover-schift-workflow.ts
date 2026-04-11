/**
 * Schift workflow 복구 + 스모크 테스트 (독립 실행)
 *
 * 1. 현재 canonical workflow 상태 확인
 * 2. malformed → archive
 * 3. 새 workflow create (graph from YAML)
 * 4. 스모크 테스트 3건
 */
import { Schift } from "@schift-io/sdk";
import * as fs from "fs";
import * as path from "path";
import { parse as parseYaml } from "yaml";

// ── Config ──

const SCHIFT_API_KEY = process.env.SCHIFT_API_KEY!;
const SCHIFT_BASE = "https://api.schift.io";
const CANONICAL_NAME = "모성간호 상담 응답";

const SMOKE_QUERIES = [
  "입덧이 너무 심해요. 언제 병원에 가야 하나요?",
  "임신 초기 출혈이 조금 있는데 바로 병원에 가야 하나요?",
  "임신 중 변비가 심한데 어떻게 완화하면 좋을까요?",
];
const CURRENT_WEEK = 10;
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../data/rag-small-results-workflow.json",
);

// ── Helpers ──

async function schiftFetch(urlPath: string, init?: RequestInit) {
  const res = await fetch(`${SCHIFT_BASE}${urlPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${SCHIFT_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Schift ${urlPath}: ${res.status} ${text}`);
  }
  return res.json();
}

function loadYamlGraph() {
  const yamlPath = path.resolve(
    __dirname,
    "../apps/web/src/lib/mobile/workflows/maternal-nursing.yaml",
  );
  const raw = fs.readFileSync(yamlPath, "utf-8");
  const yaml = parseYaml(raw) as any;

  function resolveRef(value: unknown): unknown {
    if (typeof value !== "string" || !value.startsWith("$")) return value;
    const [section, key] = value.slice(1).split(".");
    if (section === "prompts" && key in yaml.prompts) return yaml.prompts[key];
    if (section === "static_responses" && key in yaml.static_responses)
      return yaml.static_responses[key];
    return value;
  }

  function resolveConfig(config?: Record<string, unknown>) {
    if (!config) return {};
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(config)) {
      resolved[k] = resolveRef(v);
    }
    return resolved;
  }

  const blocks = yaml.blocks.map((b: any, i: number) => ({
    id: b.id,
    type: b.type,
    title: b.title,
    position: { x: 100 + i * 200, y: 100 },
    config: resolveConfig(b.config),
  }));

  const edges = yaml.edges.map((e: any, i: number) => ({
    id: `edge-${i}`,
    source: e.source,
    target: e.target,
    source_handle: e.source_handle,
    target_handle: e.target_handle,
  }));

  return {
    name: yaml.name as string,
    description: yaml.description as string,
    adminMetadata: yaml.admin_metadata,
    graph: { blocks, edges, nodes: blocks },
  };
}

// ── Main ──

async function main() {
  if (!SCHIFT_API_KEY) {
    console.error("SCHIFT_API_KEY not set");
    process.exit(1);
  }

  // Step 1: 현재 workflows 조회
  console.log("=== Step 1: 현재 워크플로우 조회 ===");
  const summaries = (await schiftFetch("/v1/workflows")) as any[];
  const detailed = await Promise.all(
    summaries.map(async (wf: any) => {
      try {
        return await schiftFetch(`/v1/workflows/${wf.id}`);
      } catch {
        return wf;
      }
    }),
  );

  for (const wf of detailed) {
    const g = wf.graph ?? {};
    const bc = (g.blocks ?? []).length;
    const nc = (g.nodes ?? []).length;
    const ec = (g.edges ?? []).length;
    console.log(
      `  ${wf.id} | ${wf.name} | ${wf.status} | blocks=${bc} nodes=${nc} edges=${ec}`,
    );
  }

  // Step 2: malformed canonical → archive
  console.log("\n=== Step 2: malformed canonical archive ===");
  const malformed = detailed.filter((wf: any) => {
    if (wf.name !== CANONICAL_NAME) return false;
    const g = wf.graph ?? {};
    const bc = (g.blocks ?? []).length;
    const nc = (g.nodes ?? []).length;
    const ec = (g.edges ?? []).length;
    return ec > 0 && bc === 0 && nc === 0;
  });

  for (const wf of malformed) {
    if (wf.status === "archived") {
      console.log(`  ${wf.id} — already archived, skip`);
      continue;
    }
    console.log(`  ${wf.id} — archiving...`);
    await schiftFetch(`/v1/workflows/${wf.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "archived" }),
    });
    console.log(`  ${wf.id} — archived`);
  }

  if (malformed.length === 0) {
    console.log("  (no malformed canonical workflows found)");
  }

  // Step 3: healthy canonical 확인 or 새로 생성
  console.log("\n=== Step 3: healthy canonical 확인/생성 ===");
  const healthy = detailed.find((wf: any) => {
    if (wf.name !== CANONICAL_NAME) return false;
    if (wf.status !== "published" && wf.status !== "active") return false;
    const g = wf.graph ?? {};
    const bc = (g.blocks ?? []).length;
    const nc = (g.nodes ?? []).length;
    return bc > 0 || nc > 0;
  });

  const yamlData = loadYamlGraph();
  let workflowId: string;

  if (healthy) {
    console.log(
      `  healthy workflow 존재: ${healthy.id} — 재사용 (새로 생성하지 않음)`,
    );
    workflowId = healthy.id;
  } else {
    console.log("  healthy workflow 없음 — 새로 생성");
    const schift = new Schift({
      apiKey: SCHIFT_API_KEY,
      baseUrl: SCHIFT_BASE,
    });
    const created = await schift.workflows.create({
      name: yamlData.name,
      description: yamlData.description,
      graph: yamlData.graph,
    });
    workflowId = created.id;
    console.log(`  created: ${workflowId}`);
  }

  // metadata patch
  const adminMetadata = {
    trigger: yamlData.adminMetadata.trigger,
    retrievalScope: yamlData.adminMetadata.retrieval_scope,
    modelName: yamlData.adminMetadata.model_name,
  };
  const updated = await schiftFetch(`/v1/workflows/${workflowId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "published",
      name: yamlData.name,
      description: `<!-- si-admin-workflow:${JSON.stringify(adminMetadata)}-->\n${yamlData.description}`,
    }),
  });
  console.log(`  patched: ${updated.id} | status=${updated.status}`);

  // graph 확인
  const finalWf = await schiftFetch(`/v1/workflows/${workflowId}`);
  const fg = finalWf.graph ?? {};
  console.log(
    `  final graph: blocks=${(fg.blocks ?? []).length}, nodes=${(fg.nodes ?? []).length}, edges=${(fg.edges ?? []).length}`,
  );

  // Step 4: 스모크 테스트
  console.log("\n=== Step 4: 스모크 테스트 (3건) ===");
  const schift = new Schift({ apiKey: SCHIFT_API_KEY, baseUrl: SCHIFT_BASE });
  const results: any[] = [];

  for (const query of SMOKE_QUERIES) {
    const start = Date.now();
    try {
      const run = await schift.workflows.run(workflowId, {
        query,
        currentWeek: CURRENT_WEEK,
      });
      const latency = Date.now() - start;

      // extract answer
      const outputs = (run as any).outputs ?? {};
      const blockStates = (run as any).block_states;
      let answer: string | null = null;

      // outputs에서 찾기
      for (const key of [
        "answer",
        "reply",
        "result",
        "output",
        "text",
        "response",
      ]) {
        if (typeof outputs[key] === "string" && outputs[key].trim()) {
          answer = outputs[key].slice(0, 300);
          break;
        }
      }

      // block_states에서 찾기
      if (!answer && blockStates) {
        const states = Array.isArray(blockStates)
          ? blockStates
          : Object.values(blockStates);
        for (const bs of states as any[]) {
          const bsOut = bs?.outputs ?? bs?.output ?? {};
          if (typeof bsOut === "object") {
            for (const key of ["answer", "reply", "result", "text"]) {
              if (typeof bsOut[key] === "string" && bsOut[key].trim()) {
                answer = bsOut[key].slice(0, 300);
                break;
              }
            }
          }
          if (answer) break;
        }
      }

      const refs = outputs.references ?? [];

      results.push({
        mode: "workflow",
        workflowId,
        workflowName: CANONICAL_NAME,
        query,
        currentWeek: CURRENT_WEEK,
        latencyMs: latency,
        status: "completed",
        error: null,
        answer,
        references: Array.isArray(refs) ? refs.slice(0, 5) : [],
      });

      console.log(`  [OK] ${query.slice(0, 30)}... ${latency}ms`);
    } catch (e: any) {
      const latency = Date.now() - start;
      results.push({
        mode: "workflow",
        workflowId,
        workflowName: CANONICAL_NAME,
        query,
        currentWeek: CURRENT_WEEK,
        latencyMs: latency,
        status: "error",
        error: e.message,
        answer: null,
        references: [],
      });
      console.log(`  [FAIL] ${query.slice(0, 30)}... ${e.message}`);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\nResults → ${OUTPUT_PATH}`);

  const passed = results.filter((r) => r.status === "completed").length;
  const failed = results.filter((r) => r.status === "error").length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
