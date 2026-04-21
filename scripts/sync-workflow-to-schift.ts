/**
 * 로컬/GCS YAML 을 Schift 워크플로우 그래프로 동기화한다.
 * Schift API 만 사용 — 우리 DB 는 건드리지 않는다.
 *
 * Usage:
 *   pnpm tsx scripts/sync-workflow-to-schift.ts
 *   WORKFLOW_ID=<id> pnpm tsx scripts/sync-workflow-to-schift.ts
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

import { syncWorkflowGraphWithBlocks } from "../packages/mobile-api/src/schift-workflows-api";
import {
  loadMaternalNursingWorkflow,
  refreshWorkflowFromStorage,
} from "../packages/mobile-api/src/workflows/load-workflow-yaml";

async function main() {
  const workflowId =
    process.env.WORKFLOW_ID ?? "f04f0498ba914399a61251a1cab6876c";
  const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

  const wfDef =
    (await refreshWorkflowFromStorage()) ?? loadMaternalNursingWorkflow();

  console.log(`syncing ${wfDef.graph.blocks.length} blocks to ${workflowId}`);
  for (const b of wfDef.graph.blocks)
    console.log(`  [${b.type}] ${b.id}  ${b.title ?? ""}`);

  await syncWorkflowGraphWithBlocks(schift, workflowId, wfDef);
  console.log("graph synced");

  // Verify
  const after = (await schift.workflows.get(workflowId)) as any;
  const nodes = after.graph.nodes ?? after.graph.blocks ?? [];
  console.log(
    `\nresult: ${nodes.length} nodes, ${after.graph.edges.length} edges`,
  );
  for (const n of nodes) {
    const cfg = JSON.stringify(n.config ?? {}).slice(0, 120);
    console.log(`  [${n.type}] ${n.id}  ${n.title}  config=${cfg}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
