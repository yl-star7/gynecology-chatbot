import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });
const WORKFLOW_ID =
  process.env.WORKFLOW_ID ?? "f04f0498ba914399a61251a1cab6876c";

async function main() {
  const wf = (await schift.workflows.get(WORKFLOW_ID)) as Record<string, any>;
  console.log("workflow keys:", Object.keys(wf));
  console.log("status:", wf.status);
  console.log("name:", wf.name);
  console.log("\n--- graph.nodes (or blocks) ---");
  const g = wf.graph ?? {};
  const nodes = g.nodes ?? g.blocks ?? [];
  for (const n of nodes) {
    console.log(`\n[${n.type}] id=${n.id} title=${n.title}`);
    const cfg = n.config ?? {};
    const ckeys = Object.keys(cfg);
    console.log("  config keys:", ckeys);
    for (const k of ckeys) {
      const v = cfg[k];
      const s = typeof v === "string" ? v : JSON.stringify(v);
      console.log(
        `  .${k}: ${s.length > 220 ? s.slice(0, 220) + "...[trunc]" : s}`,
      );
    }
  }
  console.log("\nedges count:", (g.edges ?? []).length);
  console.log("\n--- top-level workflow non-graph keys ---");
  for (const k of Object.keys(wf)) {
    if (k === "graph") continue;
    const v = (wf as any)[k];
    const s = typeof v === "string" ? v : JSON.stringify(v);
    console.log(
      `  .${k}: ${s?.length > 200 ? s.slice(0, 200) + "...[trunc]" : s}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
