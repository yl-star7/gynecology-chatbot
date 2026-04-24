import { Schift } from "@schift-io/sdk";

async function main() {
  const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

  console.log("--- Search with nonsense filter (xyz=abc) ---");
  const nonsense = await schift.search({
    query: "임신 아기",
    bucket: "pregnancy-knowledge",
    filter: { xyz: "abc" },
    topK: 3,
  });
  console.log(`  hits: ${nonsense.length}`);
  for (const r of nonsense) {
    const m = r.metadata as any;
    console.log(
      `  file=${m?.file_name} week_meta=${m?.week} surface_meta=${m?.surface}`,
    );
  }

  console.log("\n--- Search filter week=40 (files surely uploaded) ---");
  const w40 = await schift.search({
    query: "임신",
    bucket: "pregnancy-knowledge",
    filter: { week: "40" },
    topK: 3,
  });
  console.log(`  hits: ${w40.length}`);
  for (const r of w40) {
    const m = r.metadata as any;
    console.log(
      `  file=${m?.file_name} week_meta=${m?.week} surface_meta=${m?.surface}`,
    );
  }

  console.log("\n--- Search filter surface=week_day ---");
  const wd = await schift.search({
    query: "임신",
    bucket: "pregnancy-knowledge",
    filter: { surface: "week_day" },
    topK: 3,
  });
  console.log(`  hits: ${wd.length}`);
  for (const r of wd) {
    const m = r.metadata as any;
    console.log(
      `  file=${m?.file_name} week_meta=${m?.week} surface_meta=${m?.surface}`,
    );
  }

  console.log("\n--- Search no filter, look for our metadata ---");
  const all = await schift.search({
    query: "week 18 임신",
    bucket: "pregnancy-knowledge",
    topK: 5,
  });
  console.log(`  hits: ${all.length}`);
  for (const r of all) {
    const m = r.metadata as any;
    const custom: Record<string, any> = {};
    for (const k of ["week", "surface", "lang"]) {
      if (k in (m ?? {})) custom[k] = m[k];
    }
    console.log(
      `  file=${m?.file_name} custom=${JSON.stringify(custom)} keys=${Object.keys(m ?? {}).length}`,
    );
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
