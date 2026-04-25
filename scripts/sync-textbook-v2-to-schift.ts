/**
 * 가톨릭 SI 간호학 교재 v2 ingest — pdftotext 로 띄어쓰기 살린 텍스트로 재upload.
 *
 * 배경: v1(catholic_si_textbook)은 ODL extractor 가 한글 spacing 을 다 날려버려서
 * BM25 매칭률이 죽고 hybrid retrieval 품질이 떨어짐. 로컬에서 pdftotext (default mode)
 * 로 추출하면 띄어쓰기가 살아남는 것을 확인.
 *
 * Surface: common (week 비종속), source=catholic_si_textbook_v2 로 v1 과 분리
 * Chunking: Schift 기본 (text extractor → chunk_size=512, overlap=50)
 *
 * Usage:
 *   pnpm tsx scripts/sync-textbook-v2-to-schift.ts            # 실제 업로드
 *   DRY_RUN=1 pnpm tsx scripts/sync-textbook-v2-to-schift.ts  # 추출만 + 메타 출력
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env"), override: true });

const SCHIFT_API_KEY = process.env.SCHIFT_API_KEY;
const SCHIFT_API_URL = process.env.SCHIFT_API_URL ?? "https://api.schift.io";
const BUCKET_ID =
  process.env.BUCKET_ID ?? "a0275a3e30d747ddb1a35f2cd56ae8ad";
const TEXTBOOK_DIR =
  process.env.TEXTBOOK_DIR ?? "/Users/jskang/Downloads/가톨릭 SI 자료/Data";
const DRY_RUN = process.env.DRY_RUN === "1";
const SOURCE_TAG = "catholic_si_textbook_v2";

if (!SCHIFT_API_KEY) {
  console.error("SCHIFT_API_KEY is required");
  process.exit(1);
}

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
  const fn = rawFn.normalize("NFC");
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

function extractPdfText(pdfPath: string): string {
  // pdftotext default mode — preserves Korean spacing for these PDFs.
  // -layout 모드는 column 레이아웃을 복원하느라 흐름이 깨질 수 있어 default 사용.
  const out = execFileSync("pdftotext", [pdfPath, "-"], {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  return out;
}

async function main() {
  const entries = fs
    .readdirSync(TEXTBOOK_DIR)
    .filter((f) => f.endsWith(".pdf"))
    .sort();

  const chapters: ChapterMeta[] = [];
  for (const fn of entries) {
    const meta = parseChapterFilename(fn);
    if (meta) chapters.push(meta);
  }

  console.log(
    `Detected ${chapters.length} chapter PDFs in ${TEXTBOOK_DIR}\n`,
  );

  // Extract all chapters first so we can fail fast if pdftotext crashes.
  console.log(`=== Extracting text via pdftotext ===`);
  const extracted: { meta: ChapterMeta; text: string; bytes: number }[] = [];
  for (const c of chapters) {
    const pdfPath = path.join(TEXTBOOK_DIR, c.filename);
    let text: string;
    try {
      text = extractPdfText(pdfPath);
    } catch (e) {
      console.error(
        `  ✗ pdftotext failed for ${c.filename}: ${(e as Error).message}`,
      );
      continue;
    }
    const bytes = Buffer.byteLength(text, "utf8");
    extracted.push({ meta: c, text, bytes });
    console.log(
      `  ✓ ${c.filename.padEnd(40)} chapter=${c.chapter_id} pages=${c.pages} bytes=${bytes}`,
    );
  }

  console.log(
    `\nExtracted ${extracted.length}/${chapters.length} chapters (${
      extracted.reduce((s, e) => s + e.bytes, 0)
    } bytes total).`,
  );

  if (DRY_RUN) {
    console.log(
      `\nDRY_RUN=1 — upload skipped. Sample text from first chapter:`,
    );
    console.log("---");
    console.log(extracted[0]?.text.slice(0, 400));
    console.log("---");
    return;
  }

  console.log(
    `\n=== Uploading as text files (source=${SOURCE_TAG}) → bucket id=${BUCKET_ID} ===`,
  );
  let uploaded = 0;
  const failed: { chapter_id: string; error: string }[] = [];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let idx = 0; idx < extracted.length; idx++) {
    const { meta: c, text } = extracted[idx];
    const txtName = `${c.chapter_id}__${c.pages}.txt`;
    const blob = new Blob([text], { type: "text/plain" });
    const file = new File([blob], txtName, { type: "text/plain" });

    const md = {
      surface: "common",
      source: SOURCE_TAG,
      chapter: c.chapter_id,
      pages: c.pages,
      unit: c.unit,
      section: c.section,
      lang: "ko",
    };

    console.log(
      `  [${idx + 1}/${extracted.length}] ${txtName} (chapter=${c.chapter_id}, pages=${c.pages})...`,
    );

    let retries = 3;
    while (retries > 0) {
      try {
        const form = new FormData();
        form.append("files", file);
        form.append("metadata", JSON.stringify(md));

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
  console.log(`  Uploaded: ${uploaded}/${extracted.length}`);
  if (failed.length) {
    console.log(`  Failed: ${failed.length}`);
    failed.forEach((f) => console.log(`    - ${f.chapter_id}: ${f.error}`));
  }
  console.log(
    `\nQueries should filter on {"source":"${SOURCE_TAG}"} to use only the v2 (spacing-preserved) chunks.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
