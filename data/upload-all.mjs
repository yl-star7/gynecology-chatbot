import { Schift } from "@schift-io/sdk";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const API_KEY = process.env.SCHIFT_API_KEY;
if (!API_KEY) {
  throw new Error("SCHIFT_API_KEY is required");
}
const client = new Schift({ apiKey: API_KEY });
const DIR = new URL(".", import.meta.url).pathname;
const BUCKET_NAME = "pregnancy-knowledge";

// 중복 제외
const SKIP = new Set(["04_Ⅰ_01장(20~60) (1).pdf"]);

async function main() {
  const allFiles = (await readdir(DIR)).filter(f => f.endsWith(".pdf")).sort();
  const files = allFiles.filter(f => !SKIP.has(f));

  console.log(`=== ${BUCKET_NAME} 버킷에 PDF ${files.length}개 업로드 ===\n`);
  for (const f of files) console.log(`  - ${f}`);
  console.log();

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filepath = join(DIR, filename);
    const bytes = await readFile(filepath);
    const file = new File([bytes], filename, { type: "application/pdf" });
    const sizeKB = (bytes.length / 1024).toFixed(0);

    console.log(`[${i + 1}/${files.length}] ${filename} (${sizeKB} KB) ...`);
    try {
      const result = await client.db.upload(BUCKET_NAME, { files: [file] });
      console.log(`  ✓ bucket_id=${result.bucket_id}, jobs=${result.uploaded?.length ?? 0}`);
      successCount++;
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
      failCount++;
    }
  }

  console.log(`\n=== 완료: 성공 ${successCount}, 실패 ${failCount} ===`);

  // Job 상태 확인
  console.log("\n=== 처리 상태 확인 (10초 간격, 최대 5분) ===");
  const TERMINAL = new Set(["ready", "completed", "failed", "cancelled"]);
  for (let i = 0; i < 30; i++) {
    try {
      const buckets = await client.listBuckets();
      const bucket = buckets.find(b => b.name === BUCKET_NAME);
      if (!bucket) { console.log("버킷을 찾을 수 없음"); break; }
      const { file_count, vector_count, active_job_count } = bucket;
      console.log(`[${i + 1}] 파일: ${file_count}, 벡터: ${vector_count}, 진행중 job: ${active_job_count}`);
      if (active_job_count === 0 && vector_count > 0) {
        console.log("모든 처리 완료!");
        break;
      }
    } catch (e) {
      console.log(`[${i + 1}] 상태 조회 실패: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
}

main().catch(e => { console.error("Error:", e); process.exit(1); });
