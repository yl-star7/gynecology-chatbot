import { Schift } from "@schift-io/sdk";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const API_KEY = process.env.SCHIFT_API_KEY ?? "sch_Rb3datf6bNCzvkf4L6lsuXLlQP6TUTmkwMlTAxKv6kM";
const client = new Schift({ apiKey: API_KEY });
const DIR = new URL(".", import.meta.url).pathname;

const BUCKET_NAME = "korean-textbook";

async function main() {
  // 1. 파일 업로드 (db.upload은 bucket name을 받아서 내부에서 ID 찾음)
  const filename = "06_Ⅱ_01-03장(565~590).pdf";
  const filepath = join(DIR, filename);
  const bytes = await readFile(filepath);
  const file = new File([bytes], filename, { type: "application/pdf" });

  console.log(`=== 1. 업로드: ${filename} (${(bytes.length / 1024).toFixed(0)} KB) ===`);
  const uploadResult = await client.db.upload(BUCKET_NAME, { files: [file] });
  const bucketId = uploadResult.bucket_id;
  console.log("업로드 완료. Bucket ID:", bucketId);
  console.log("Job:", JSON.stringify(uploadResult.uploaded, null, 2));

  // 2. 처리 대기 (job_id 직접 폴링)
  console.log("\n=== 2. 처리 대기 ===");
  const TERMINAL = new Set(["ready", "completed", "failed", "cancelled"]);
  // 업로드 응답에서 job_id 추출
  const jobIds = uploadResult.uploaded
    .flatMap(u => (u.jobs ?? []).map(j => j.job_id))
    .filter(Boolean);

  if (jobIds.length > 0) {
    console.log(`추적 job: ${jobIds.join(", ")}`);
    for (let i = 0; i < 60; i++) {
      const statuses = await Promise.all(jobIds.map(id => client.getJob(id)));
      const pending = statuses.filter(j => j && !TERMINAL.has(j.status));
      const display = statuses.map(j => `${j?.status ?? "?"}`).join(", ");
      console.log(`[${i + 1}] ${display} (대기중: ${pending.length})`);
      if (pending.length === 0) { console.log("처리 완료!"); break; }
      if (i === 59) console.log("타임아웃 (10분)");
      await new Promise(r => setTimeout(r, 10000));
    }
  } else {
    // fallback: listJobs
    for (let i = 0; i < 60; i++) {
      const jobs = await client.listJobs({ bucketId, limit: 10 });
      const pending = jobs.filter(j => !TERMINAL.has(j.status));
      console.log(`[${i + 1}] 전체: ${jobs.length}개, 처리중: ${pending.length}개`);
      if (pending.length === 0 && jobs.length > 0) { console.log("처리 완료!"); break; }
      if (i === 59) console.log("타임아웃 (10분)");
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  // 3. 검색 테스트
  console.log("\n=== 3. 검색 테스트 ===");
  const queries = [
    "민주주의의 기본 원리",
    "경제 성장",
    "국민의 권리와 의무",
  ];

  for (const query of queries) {
    console.log(`\n검색: "${query}"`);
    try {
      const results = await client.bucketSearch(bucketId, { query, topK: 3 });
      if (results?.length > 0) {
        for (const r of results) {
          console.log(`  [${(r.score * 100).toFixed(1)}%] ${(r.text ?? r.content ?? "").substring(0, 120)}...`);
        }
      } else {
        console.log("  결과 없음 (아직 인덱싱 중일 수 있음)");
      }
    } catch (e) {
      console.error(`  검색 실패: ${e.message}`);
    }
  }

  // 4. RAG Chat
  console.log("\n=== 4. RAG Chat ===");
  try {
    const response = await client.chat({
      bucketId,
      message: "이 교과서에서 다루는 주요 주제들을 정리해줘",
      topK: 5,
    });
    console.log(`답변: ${response.reply?.substring(0, 500)}`);
    console.log(`출처: ${response.sources?.length ?? 0}개 문서`);
  } catch (e) {
    console.error("Chat 실패:", e.message);
  }
}

main().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
