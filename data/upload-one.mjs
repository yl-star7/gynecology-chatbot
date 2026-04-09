import { Schift } from "@schift-io/sdk";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const API_KEY = process.env.SCHIFT_API_KEY ?? "sch_Rb3datf6bNCzvkf4L6lsuXLlQP6TUTmkwMlTAxKv6kM";
const client = new Schift({ apiKey: API_KEY });
const DIR = new URL(".", import.meta.url).pathname;

async function main() {
  // 1. 기존 bucket 찾기
  console.log("=== 1. Bucket 찾기 ===");
  const buckets = await client.listBuckets();
  const bucket = buckets.find(b => b.name === "korean-textbook");
  if (!bucket) {
    console.error("korean-textbook bucket을 찾을 수 없습니다. demo.mjs를 먼저 실행하세요.");
    process.exit(1);
  }
  const bucketId = bucket.id ?? bucket.bucket_id ?? bucket._id;
  console.log("Bucket ID:", bucketId);

  // 2. 추가 파일 업로드
  const filename = "06_Ⅱ_01-03장(565~590).pdf";
  const filepath = join(DIR, filename);
  const bytes = await readFile(filepath);
  const file = new File([bytes], filename, { type: "application/pdf" });

  console.log(`\n=== 2. 업로드: ${filename} (${(bytes.length / 1024).toFixed(0)} KB) ===`);
  try {
    const result = await client.db.upload(bucketId, { files: [file] });
    console.log("업로드 결과:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("업로드 실패:", e.message);
  }

  // 3. 처리 대기
  console.log("\n=== 3. 처리 대기 ===");
  for (let i = 0; i < 30; i++) {
    const jobs = await client.listJobs({ bucketId, limit: 10 });
    const pending = jobs.filter(j => j.status !== "completed" && j.status !== "failed");
    console.log(`[${i + 1}] 처리중: ${pending.length}개`);
    if (pending.length === 0 && jobs.length > 0) {
      console.log("처리 완료!");
      break;
    }
    await new Promise(r => setTimeout(r, 10000));
  }

  // 4. 검색 테스트
  console.log("\n=== 4. 검색 테스트 ===");
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
          console.log(`  [${(r.score * 100).toFixed(1)}%] ${(r.text ?? r.content ?? "").substring(0, 100)}...`);
        }
      } else {
        console.log("  결과 없음");
      }
    } catch (e) {
      console.error(`  검색 실패: ${e.message}`);
    }
  }

  // 5. RAG Chat
  console.log("\n=== 5. RAG Chat ===");
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
