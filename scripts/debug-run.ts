import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

async function main() {
  const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });
  const run = (await schift.workflows.run("f04f0498ba914399a61251a1cab6876c", {
    query: "오늘 기분이 좋아요.",
    currentWeek: 27,
    workflowStage: 0,
    selectedMood: "joyful",
    compactSummary: "",
    lastScenario: "",
    lastCharacterTone: "",
    lastEmotionTone: "",
    hasImages: false,
    retrievalQuery: "",
    results: "",
    promptItems: "",
    sessionId: "dbg",
    weekKnowledgeEntityId: "",
    tonePreference: "",
    personaHint: "",
    personaConfidence: "",
    selectedQuestionId: "",
  })) as any;
  console.log("top keys:", Object.keys(run));
  console.log("status:", run.status);
  console.log("outputs keys:", Object.keys(run.outputs ?? {}));
  console.log("outputs full:", JSON.stringify(run.outputs, null, 2));
  console.log("\n--- block outputs ---");
  for (const [id, st] of Object.entries(run.block_states ?? {}) as [
    string,
    any,
  ][]) {
    console.log(`\n[${id}] status=${st.status} duration=${st.duration_ms}ms`);
    if (st.error) console.log(`  error: ${JSON.stringify(st.error)}`);
    for (const [k, v] of Object.entries(st.outputs ?? {})) {
      const s = typeof v === "string" ? v : JSON.stringify(v);
      console.log(
        `  ${k}: ${s.length > 300 ? s.slice(0, 300) + "...[trunc]" : s}`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
