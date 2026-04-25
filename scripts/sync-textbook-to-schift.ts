/**
 * 가톨릭 SI 간호학 교재 챕터 PDF를 pregnancy-knowledge 버킷에 common surface로 ingest.
 *
 * 원본: /Users/jskang/Downloads/가톨릭 SI 자료/Data/04_*, 05_*, 06_*.pdf (16개)
 * Surface: common (week에 묶이지 않는 reference)
 * Chunking: Schift 기본 (page-aware, chunk_size=512, overlap=50)
 *
 * Usage:
 *   pnpm tsx scripts/sync-textbook-to-schift.ts            # 실제 업로드
 *   DRY_RUN=1 pnpm tsx scripts/sync-textbook-to-schift.ts  # 파일/메타데이터만 출력
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";
// override:true 이유 — 모노레포 direnv 가 미리 admin 키를 SCHIFT_API_KEY 로 깔아두기 때문에
// 프로젝트 .env.local 의 si org 키가 무시되는 사고가 있었음.
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env"), override: true });

const SCHIFT_API_KEY = process.env.SCHIFT_API_KEY;
const SCHIFT_API_URL =
  process.env.SCHIFT_API_URL ?? "https://api.schift.io";
// 기존 pregnancy-knowledge bucket을 ID로 직접 지정 (SDK name lookup 우회).
// 이름 일치 검색이 불일치 케이스가 있어 v2 등 신규 생성을 만들 수 있음.
const BUCKET_ID =
  process.env.BUCKET_ID ?? "a0275a3e30d747ddb1a35f2cd56ae8ad";
const TEXTBOOK_DIR =
  process.env.TEXTBOOK_DIR ?? "/Users/jskang/Downloads/가톨릭 SI 자료/Data";
const DRY_RUN = process.env.DRY_RUN === "1";

if (!SCHIFT_API_KEY) {
  console.error("SCHIFT_API_KEY is required");
  process.exit(1);
}

// 파일명 파싱: "04_Ⅰ_02-03장(61~90).pdf" → {unit, section, chapter, pages}
type ChapterMeta = {
  filename: string;
  unit: string;
  section: string;
  chapter: string;
  chapter_id: string;
  pages: string;
  page_start: number;
  page_end: number;
};

function parseChapterFilename(rawFn: string): ChapterMeta | null {
  // macOS readdir returns NFD filenames; normalize to NFC for regex matching.
  const fn = rawFn.normalize("NFC");
  // 04_Ⅰ_02-03장(61~90).pdf
  // 04_Ⅱ_01장(149~180).pdf
  const m = fn.match(
    /^(\d+)_(Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|Ⅵ|Ⅶ|Ⅷ|Ⅸ|Ⅹ)_([\d\-]+)장\((\d+)[~\-](\d+)\)\.pdf$/u,
  );
  if (!m) return null;
  const [, unit, section, chapter, ps, pe] = m;
  return {
    filename: rawFn,
    unit,
    section,
    chapter,
    chapter_id: `${unit}_${section}_${chapter}`,
    pages: `${ps}-${pe}`,
    page_start: parseInt(ps, 10),
    page_end: parseInt(pe, 10),
  };
}

async function main() {
  const entries = fs
    .readdirSync(TEXTBOOK_DIR)
    .filter((f) => f.endsWith(".pdf"))
    .sort();

  const chapters: ChapterMeta[] = [];
  const skipped: string[] = [];
  for (const fn of entries) {
    const meta = parseChapterFilename(fn);
    if (meta) chapters.push(meta);
    else skipped.push(fn);
  }

  console.log(`Detected ${chapters.length} chapter PDFs in ${TEXTBOOK_DIR}`);
  if (skipped.length) {
    console.log(`Skipped (filename not chapter pattern):`);
    skipped.forEach((s) => console.log(`  - ${s}`));
  }

  console.log(
    `\n=== Ingest plan (surface=common, bucket_id=${BUCKET_ID}) ===`,
  );
  for (const c of chapters) {
    console.log(
      `  ${c.filename.padEnd(40)} → chapter=${c.chapter_id}, pages=${c.pages}`,
    );
  }

  if (DRY_RUN) {
    console.log(
      `\nDRY_RUN=1 — 업로드 생략. ${chapters.length}개 chapter 준비 완료.`,
    );
    return;
  }

  console.log(
    `\nUploading ${chapters.length} chapter PDFs directly to bucket id=${BUCKET_ID}...`,
  );
  let uploaded = 0;
  const failed: { chapter_id: string; error: string }[] = [];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let idx = 0; idx < chapters.length; idx++) {
    const c = chapters[idx];
    const fullPath = path.join(TEXTBOOK_DIR, c.filename);
    const buf = fs.readFileSync(fullPath);
    const file = new File([buf], c.filename, { type: "application/pdf" });

    const meta = {
      surface: "common",
      source: "catholic_si_textbook",
      chapter: c.chapter_id,
      pages: c.pages,
      unit: c.unit,
      section: c.section,
      lang: "ko",
    };

    console.log(
      `  [${idx + 1}/${chapters.length}] ${c.filename} (chapter=${c.chapter_id}, pages=${c.pages})...`,
    );

    let retries = 3;
    while (retries > 0) {
      try {
        const form = new FormData();
        form.append("files", file);
        form.append("metadata", JSON.stringify(meta));

        const resp = await fetch(
          `${SCHIFT_API_URL}/v1/buckets/${BUCKET_ID}/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${SCHIFT_API_KEY}` },
            body: form,
          },
        );

        if (!resp.ok) {
          const errBody = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${errBody.slice(0, 300)}`);
        }
        const json = (await resp.json()) as { jobs?: unknown[] };
        const queued = (json.jobs as unknown[] | undefined)?.length ?? 0;
        uploaded += queued;
        console.log(`    ✓ uploaded (jobs queued: ${queued})`);
        break;
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.includes("429") && retries > 1) {
          retries--;
          console.log(
            `    ⏳ Rate limited, waiting 10s... (${retries} retries left)`,
          );
          await sleep(10000);
        } else {
          console.error(`    ✗ Upload failed: ${msg}`);
          failed.push({ chapter_id: c.chapter_id, error: msg });
          break;
        }
      }
    }

    await sleep(500);
  }

  console.log(`\n=== Done ===`);
  console.log(`  Uploaded: ${uploaded}/${chapters.length}`);
  if (failed.length) {
    console.log(`  Failed: ${failed.length}`);
    failed.forEach((f) => console.log(`    - ${f.chapter_id}: ${f.error}`));
  }
  console.log(
    `\nBucket id=${BUCKET_ID} should now have additional ~${chapters.length} files queued for chunk-and-embed.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
