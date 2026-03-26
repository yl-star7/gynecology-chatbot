import { Schift } from "@schift-io/sdk";

async function main() {
  const s = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

  // 1. Collections
  console.log("=== Collections ===");
  const cols = await s.listCollections();
  for (const c of cols) {
    console.log(`  ${c.name} | vectors: ${c.vector_count} | id: ${c.id}`);
  }

  // 2. Workflows (raw fetch since SDK list may not work)
  console.log("\n=== Workflows (raw API) ===");
  const wfRes = await fetch("https://api.schift.io/v1/workflows", {
    headers: { Authorization: `Bearer ${process.env.SCHIFT_API_KEY}` },
  });
  const wfData = await wfRes.json();
  const workflows = Array.isArray(wfData) ? wfData : wfData.workflows ?? [];
  if (workflows.length === 0) {
    console.log("  (no workflows)");
  }
  for (const wf of workflows) {
    console.log(`  ${wf.id} | ${wf.name} | status: ${wf.status}`);
    const blocks = wf.graph?.blocks ?? wf.graph?.nodes ?? [];
    for (const b of blocks) {
      if (["retriever", "vector_store", "collection", "llm", "prompt_template"].includes(b.type)) {
        console.log(`    block: ${b.type} | config: ${JSON.stringify(b.config)}`);
      }
    }
  }

  // 3. Search test
  console.log("\n=== Search test: '임신 13주 두통' ===");
  try {
    const results = await s.search({
      query: "임신 13주 두통",
      collection: "pregnancy-knowledge",
      topK: 3,
    });
    for (const r of results) {
      console.log(`  score: ${r.score.toFixed(4)} | ${r.metadata?.title ?? r.id}`);
    }
    if (results.length === 0) console.log("  (no results)");
  } catch (e: any) {
    console.log("  search error:", e.message);
  }

  // 4. Chat test (direct bucket RAG)
  console.log("\n=== Chat test (bucketId RAG) ===");
  try {
    const knowledgeCol = cols.find((c: any) => c.name === "pregnancy-knowledge");
    if (knowledgeCol) {
      const chatResult = await s.chat({
        bucketId: knowledgeCol.id,
        message: "임신 13주차에 두통이 있어요. 어떻게 해야 하나요?",
      });
      console.log(`  reply: ${chatResult.reply.slice(0, 200)}...`);
      console.log(`  sources: ${chatResult.sources?.length ?? 0}건`);
    } else {
      console.log("  pregnancy-knowledge collection not found");
    }
  } catch (e: any) {
    console.log("  chat error:", e.message);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
