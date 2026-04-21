import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

const WORKFLOW_ID =
  process.env.WORKFLOW_ID ?? "f04f0498ba914399a61251a1cab6876c";
const API_KEY = process.env.SCHIFT_API_KEY!;
const BASE_URL =
  process.env.SCHIFT_API_URL?.replace(/\/$/, "") ?? "https://api.schift.io";

async function main() {
  const wf = (await new Schift({ apiKey: API_KEY }).workflows.get(
    WORKFLOW_ID,
  )) as any;
  const graph = wf.graph;
  const nodes = graph.nodes ?? graph.blocks;
  let changed = false;
  for (const n of nodes) {
    if (n.type === "answer") {
      const before = n.config?.include_sources;
      n.config = { ...(n.config ?? {}), include_sources: false };
      console.log(
        `answer block ${n.id}: include_sources ${before} → ${n.config.include_sources}`,
      );
      changed = true;
    }
  }
  if (!changed) {
    console.log("no answer block found");
    return;
  }

  // PATCH directly
  const res = await fetch(`${BASE_URL}/v1/workflows/${WORKFLOW_ID}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ graph }),
  });
  console.log("PATCH status:", res.status);
  const body = await res.text();
  console.log("body:", body.slice(0, 400));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
