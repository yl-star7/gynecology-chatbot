import { Schift } from "@schift-io/sdk";

async function main() {
  const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

  const buckets = await schift.listBuckets();
  const b = buckets.find((x: any) => x.name === "pregnancy-knowledge");
  console.log(
    "bucket:",
    JSON.stringify({
      name: b?.name,
      file_count: b?.file_count,
      vector_count: b?.vector_count,
      active_jobs: b?.active_job_count,
    }),
  );

  console.log("\n--- Search week=18 filtered ---");
  const withFilter = await schift.search({
    query: "임신 아기 발달",
    bucket: "pregnancy-knowledge",
    filter: { week: "18" },
    topK: 3,
  });
  for (const r of withFilter) {
    console.log(
      `  score=${r.score.toFixed(3)} meta=${JSON.stringify(r.metadata)}`,
    );
  }
  if (withFilter.length === 0) console.log("  (no results)");

  console.log("\n--- Search no filter ---");
  const noFilter = await schift.search({
    query: "임신 아기 발달",
    bucket: "pregnancy-knowledge",
    topK: 3,
  });
  for (const r of noFilter) {
    console.log(
      `  score=${r.score.toFixed(3)} meta=${JSON.stringify(r.metadata)}`,
    );
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
