import { Schift } from "@schift-io/sdk";

async function main() {
  const s = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

  console.log("=== Collections ===");
  try {
    const cols = await s.listCollections();
    console.log(JSON.stringify(cols, null, 2));
  } catch (e: any) {
    console.log("listCollections error:", e.message);
  }

  console.log("\n=== Workflows ===");
  try {
    const wfs = await s.workflows.list();
    for (const wf of wfs) {
      console.log(`  ${wf.id} | ${wf.name} | ${wf.status}`);
      // collection 블록 확인
      for (const block of wf.graph.blocks) {
        if (block.type === "collection" || block.type === "vector_store" || block.type === "retriever") {
          console.log(`    block: ${block.type} | ${block.title} | config: ${JSON.stringify(block.config)}`);
        }
      }
    }
  } catch (e: any) {
    console.log("listWorkflows error:", e.message);
  }

  console.log("\n=== DB Upload test (dry) ===");
  // 빈 파일로 기존 버킷 목록 확인
  try {
    const testBlob = new Blob(["test"], { type: "text/plain" });
    const testFile = new File([testBlob], "test.txt", { type: "text/plain" });
    const result = await s.db.upload("pregnancy-knowledge", { files: [testFile] });
    console.log("Upload succeeded:", JSON.stringify(result));
  } catch (e: any) {
    console.log("Upload error:", e.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
