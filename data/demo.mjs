import { Schift } from "@schift-io/sdk";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const API_KEY = process.env.SCHIFT_API_KEY ?? "sch_Rb3datf6bNCzvkf4L6lsuXLlQP6TUTmkwMlTAxKv6kM";
const client = new Schift({ apiKey: API_KEY });

const DIR = new URL(".", import.meta.url).pathname;

async function main() {
  // 1. Bucket 생성
  console.log("=== 1. Bucket 생성 ===");
  let bucket;
  try {
    bucket = await client.createBucket({ name: "korean-textbook", description: "한국 교과서 PDF 데모" });
    console.log("Bucket 생성 완료:", bucket);
  } catch (e) {
    console.log("Bucket 생성 실패 (이미 존재할 수 있음):", e.message);
    // 기존 버킷 목록에서 찾기
    const buckets = await client.listBuckets();
    console.log("기존 Buckets:", buckets);
    bucket = buckets.find(b => b.name === "korean-textbook") ?? buckets[0];
    if (!bucket) {
      console.error("사용 가능한 bucket이 없습니다.");
      process.exit(1);
    }
  }

  const bucketId = bucket.id ?? bucket.bucket_id ?? bucket._id;
  console.log("사용할 Bucket ID:", bucketId);

  // 2. PDF 파일 업로드 (Free tier: 100 pages/month -> 작은 파일 2개만 먼저)
  console.log("\n=== 2. PDF 업로드 ===");
  const files = (await readdir(DIR)).filter(f => f.endsWith(".pdf")).sort();

  // 작은 파일 2개 선택 (Free tier 제한 고려)
  const targetFiles = [
    "04_Ⅰ_05장(131~148).pdf",   // ~18 pages
    "04_Ⅰ_02-03장(61~90).pdf",  // ~30 pages
  ].filter(f => files.includes(f));

  console.log(`업로드할 파일 (${targetFiles.length}개):`, targetFiles);

  for (const filename of targetFiles) {
    const filepath = join(DIR, filename);
    const bytes = await readFile(filepath);
    const file = new File([bytes], filename, { type: "application/pdf" });

    console.log(`\n업로드 중: ${filename} (${(bytes.length / 1024).toFixed(0)} KB)`);
    try {
      const result = await client.db.upload(bucketId, { files: [file] });
      console.log("업로드 결과:", JSON.stringify(result, null, 2));
    } catch (e) {
      console.error(`업로드 실패: ${e.message}`);
    }
  }

  // 3. Job 상태 확인 (OCR + 임베딩 처리 대기)
  console.log("\n=== 3. 처리 상태 확인 ===");
  let allDone = false;
  for (let i = 0; i < 30; i++) {
    const jobs = await client.listJobs({ bucketId, limit: 10 });
    const pending = jobs.filter(j => j.status !== "completed" && j.status !== "failed");
    console.log(`[${i + 1}] Jobs: ${jobs.length}개 (처리중: ${pending.length}개)`);

    if (jobs.length > 0) {
      for (const job of jobs.slice(0, 3)) {
        console.log(`  - ${job.filename ?? job.id}: ${job.status}`);
      }
    }

    if (pending.length === 0 && jobs.length > 0) {
      allDone = true;
      console.log("모든 처리 완료!");
      break;
    }

    // 10초 대기
    await new Promise(r => setTimeout(r, 10000));
  }

  if (!allDone) {
    console.log("처리가 아직 진행 중이지만, 검색 테스트를 시도합니다...");
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
      const results = await client.bucketSearch(bucketId, {
        query,
        topK: 3,
      });

      if (results && results.length > 0) {
        for (const r of results) {
          console.log(`  [${(r.score * 100).toFixed(1)}%] ${(r.text ?? r.content ?? "").substring(0, 100)}...`);
        }
      } else {
        console.log("  결과 없음 (아직 인덱싱 중일 수 있음)");
      }
    } catch (e) {
      console.error(`  검색 실패: ${e.message}`);
    }
  }

  // 5. RAG Chat 테스트
  console.log("\n=== 5. RAG Chat 테스트 ===");
  const chatQueries = [
    "이 교과서의 주요 내용을 요약해줘",
    "민주주의에 대해 설명해줘",
  ];

  for (const msg of chatQueries) {
    console.log(`\n질문: "${msg}"`);
    try {
      const response = await client.chat({
        bucketId,
        message: msg,
        topK: 5,
      });
      console.log(`답변: ${response.reply?.substring(0, 300)}...`);
      console.log(`출처: ${response.sources?.length ?? 0}개 문서`);
    } catch (e) {
      console.error(`Chat 실패: ${e.message}`);
    }
  }

  // 6. 사용량 확인
  console.log("\n=== 6. 사용량 확인 ===");
  try {
    const usage = await client.usage();
    console.log("사용량:", JSON.stringify(usage, null, 2));
  } catch (e) {
    console.log("사용량 조회:", e.message);
  }
}

main().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
