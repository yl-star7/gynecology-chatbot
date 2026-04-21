import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

const BUCKET = "pregnancy-knowledge";

async function main() {
  const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

  // Upload one tiny text file
  const content = `# 테스트 문서 ${Date.now()}\n임신 테스트 문서입니다. 업로드 파이프라인 확인용.`;
  const file = new File(
    [new Blob([content], { type: "text/plain" })],
    `test-upload-${Date.now()}.txt`,
    { type: "text/plain" },
  );
  console.log("uploading...");
  const t0 = performance.now();
  const r = await schift.db.upload(BUCKET, { files: [file] });
  const upMs = Math.round(performance.now() - t0);
  console.log(`upload http OK (${upMs}ms):`, JSON.stringify(r).slice(0, 400));

  // Poll bucket stats
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const buckets = (await fetch("https://api.schift.io/v1/buckets", {
      headers: { Authorization: `Bearer ${process.env.SCHIFT_API_KEY}` },
    }).then((r) => r.json())) as any[];
    const b = buckets.find((x: any) => x.name === BUCKET);
    if (!b) {
      console.log("bucket missing");
      continue;
    }
    console.log(
      `  t+${(i + 1) * 3}s  files=${b.file_count}  vectors=${b.vector_count}  active_jobs=${b.active_job_count}`,
    );
    if (b.active_job_count === 0) {
      console.log("=> jobs drained");
      break;
    }
  }

  // Poll per-file job status (if endpoint exists)
  const jobs = (await fetch(
    `https://api.schift.io/v1/jobs?bucket_id=${r.bucket_id}`,
    { headers: { Authorization: `Bearer ${process.env.SCHIFT_API_KEY}` } },
  ).then((r) => r.json())) as any[];
  const recent = jobs.slice(0, 3);
  for (const j of recent) {
    console.log(
      `job: file=${j.file_name} err=${(j.error_message ?? "").slice(0, 100)} retryable=${j.retryable}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
