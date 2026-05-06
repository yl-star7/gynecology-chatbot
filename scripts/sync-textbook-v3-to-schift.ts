/**
 * 가톨릭 SI 간호학 교재 v3 ingest — gemini-2.5-flash-lite vision OCR 로 깨끗하게 추출.
 *
 * 배경:
 * - v1 (ODL): 한글 spacing 손실, 그러나 column 흐름은 정상
 * - v2 (pdftotext): spacing 살아남, 하지만 2-column PDF 가 인터리빙되어 의미 깨짐
 * - v3 (이 스크립트): 페이지 이미지 → Gemini vision → 깨끗한 markdown
 *
 * Surface: common, source=catholic_si_textbook_v3
 *
 * Pipeline (per PDF):
 *   1) pdftoppm 으로 PNG 렌더링 (DPI 200)
 *   2) 각 페이지를 Gemini 2.5 Flash Lite 에 vision 으로 보내서 markdown 추출
 *   3) 페이지를 결합해서 chapter 당 1 .txt 로 업로드
 *
 * Usage:
 *   pnpm tsx scripts/sync-textbook-v3-to-schift.ts            # 실제 업로드
 *   DRY_RUN=1 pnpm tsx scripts/sync-textbook-v3-to-schift.ts  # PDF 1 페이지만 추출해 결과 확인
 *   ONLY_CHAPTER=04_Ⅲ_01-02 pnpm tsx scripts/sync-textbook-v3-to-schift.ts  # 한 chapter 만
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
// SCHIFT_API_KEY 는 si .env.local 이 우선 (admin 키 shadowing 방지),
// GEMINI_API_KEY 는 shell 환경(monorepo direnv) 의 working 키 우선 — si .env.local 키가 만료된 상태이기 때문.
const SHELL_GEMINI = process.env.GEMINI_API_KEY;
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env"), override: true });
if (SHELL_GEMINI) process.env.GEMINI_API_KEY = SHELL_GEMINI;

const SCHIFT_API_KEY = process.env.SCHIFT_API_KEY;
const SCHIFT_API_URL = process.env.SCHIFT_API_URL ?? "https://api.schift.io";
const BUCKET_ID =
  process.env.BUCKET_ID ?? "a0275a3e30d747ddb1a35f2cd56ae8ad";
const TEXTBOOK_DIR =
  process.env.TEXTBOOK_DIR ?? "/Users/jskang/Downloads/가톨릭 SI 자료/Data";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DRY_RUN = process.env.DRY_RUN === "1";
const ONLY_CHAPTER = process.env.ONLY_CHAPTER;
const SOURCE_TAG = "catholic_si_textbook_v3";
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? "4", 10);
const DPI = parseInt(process.env.DPI ?? "200", 10);

if (!SCHIFT_API_KEY) {
  console.error("SCHIFT_API_KEY is required");
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is required");
  process.exit(1);
}

type GoogleVisionClient = {
  models: {
    generateContent(input: {
      model: string;
      contents: Array<
        | string
        | {
            inlineData: {
              mimeType: string;
              data: string;
            };
          }
      >;
    }): Promise<{ text?: string }>;
  };
};

async function createGenaiClient(apiKey: string): Promise<GoogleVisionClient> {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey });
}

const genaiPromise = createGenaiClient(GEMINI_API_KEY);

const VISION_PROMPT = `이 이미지는 한국어 간호학 교재의 한 페이지입니다. 다음 규칙으로 깨끗한 markdown 으로 추출하세요.

규칙:
1. 글의 자연스러운 읽기 순서를 따라 텍스트를 재구성합니다 (2-column 레이아웃이라면 좌→우 column 순서로, 한 column 의 문장이 끝까지 이어진 다음 다음 column 으로).
2. 한국어 띄어쓰기를 정확히 유지/복원합니다.
3. 표(table)는 markdown table 또는 정돈된 list 로 변환합니다.
4. 그림 캡션은 \`*그림: ...*\` 형태로 보존합니다.
5. PDF 페이지 헤더/푸터/페이지번호/날짜 같은 boilerplate 는 제거합니다.
6. 학습목표·단원 표제 같은 구조는 markdown 헤더(##, ###)로 표현합니다.
7. 학술 용어는 그대로 유지하고 영문 약어는 보존합니다.

페이지에 텍스트가 거의 없거나(목차/표지 등) 의학 컨텐츠가 아니면 빈 응답으로 답하세요.
설명·comment·"이 페이지는..." 같은 메타 텍스트를 추가하지 말고 추출 결과 markdown 만 반환하세요.`;

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

function renderPdfPages(pdfPath: string, outDir: string): string[] {
  // pdftoppm <pdf> <prefix> -png -r <dpi>
  // outputs: prefix-001.png, prefix-002.png, ...
  const prefix = path.join(outDir, "page");
  execFileSync("pdftoppm", [pdfPath, prefix, "-png", "-r", String(DPI)], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  const files = fs
    .readdirSync(outDir)
    .filter((f) => f.startsWith("page-") && f.endsWith(".png"))
    .sort();
  return files.map((f) => path.join(outDir, f));
}

async function ocrPage(imagePath: string): Promise<string> {
  const imgBytes = fs.readFileSync(imagePath);
  const imgBase64 = imgBytes.toString("base64");
  const genai = await genaiPromise;

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      VISION_PROMPT,
      {
        inlineData: {
          mimeType: "image/png",
          data: imgBase64,
        },
      },
    ],
  });

  return (response.text ?? "").trim();
}

async function processChapter(
  c: ChapterMeta,
): Promise<{ chapter_id: string; text: string; pageCount: number }> {
  const pdfPath = path.join(TEXTBOOK_DIR, c.filename);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `textbook-v3-${c.chapter_id}-`));

  try {
    console.log(`  [${c.chapter_id}] rendering pages at ${DPI}dpi...`);
    const pageImages = renderPdfPages(pdfPath, tmpDir);
    console.log(`  [${c.chapter_id}] ${pageImages.length} pages → OCR (concurrency=${CONCURRENCY})`);

    // OCR pages in parallel batches
    const pageTexts: string[] = new Array(pageImages.length).fill("");
    for (let i = 0; i < pageImages.length; i += CONCURRENCY) {
      const batch = pageImages.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (img, j) => {
          const idx = i + j;
          let retries = 3;
          while (retries > 0) {
            try {
              return { idx, text: await ocrPage(img) };
            } catch (e) {
              const err = e as Error & { status?: number; cause?: unknown };
              retries--;
              if (retries === 0) {
                console.warn(
                  `    page ${idx + 1}: failed status=${err.status} msg=${err.message}`,
                );
                if (err.cause)
                  console.warn(`      cause: ${String(err.cause)}`);
                return { idx, text: "" };
              }
              const wait = 2000 * (4 - retries);
              await new Promise((r) => setTimeout(r, wait));
            }
          }
          return { idx, text: "" };
        }),
      );
      for (const { idx, text } of results) pageTexts[idx] = text;
      process.stdout.write(`    progress: ${Math.min(i + CONCURRENCY, pageImages.length)}/${pageImages.length}\r`);
    }
    process.stdout.write("\n");

    // Combine pages with page markers (so chunker has a hint at boundaries)
    const combined = pageTexts
      .map((t, i) => {
        if (!t.trim()) return "";
        const physicalPage = c.page_start + i;
        return `<!-- page=${physicalPage} -->\n\n${t}`;
      })
      .filter(Boolean)
      .join("\n\n---\n\n");

    return {
      chapter_id: c.chapter_id,
      text: combined,
      pageCount: pageImages.length,
    };
  } finally {
    // cleanup tmp images
    try {
      for (const f of fs.readdirSync(tmpDir)) {
        fs.unlinkSync(path.join(tmpDir, f));
      }
      fs.rmdirSync(tmpDir);
    } catch {
      // ignore cleanup errors
    }
  }
}

async function uploadChapter(
  c: ChapterMeta,
  text: string,
  pageCount: number,
): Promise<{ ok: boolean; error?: string }> {
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
    extractor: "gemini-2.5-flash-lite",
    page_count: String(pageCount),
    lang: "ko",
  };

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
    return { ok: false, error: `HTTP ${resp.status}: ${errBody.slice(0, 200)}` };
  }
  return { ok: true };
}

async function main() {
  const entries = fs
    .readdirSync(TEXTBOOK_DIR)
    .filter((f) => f.endsWith(".pdf"))
    .sort();

  const allChapters: ChapterMeta[] = [];
  for (const fn of entries) {
    const meta = parseChapterFilename(fn);
    if (meta) allChapters.push(meta);
  }

  const chapters = ONLY_CHAPTER
    ? allChapters.filter((c) => c.chapter_id === ONLY_CHAPTER)
    : allChapters;

  if (ONLY_CHAPTER && chapters.length === 0) {
    console.error(`No chapter matches ONLY_CHAPTER=${ONLY_CHAPTER}`);
    process.exit(1);
  }

  console.log(
    `Detected ${allChapters.length} chapter PDFs; processing ${chapters.length}\n`,
  );

  if (DRY_RUN) {
    const c = chapters[0];
    console.log(`DRY_RUN — extracting first chapter only: ${c.chapter_id}`);
    const result = await processChapter(c);
    console.log(`\n--- Sample extracted text (first 1500 chars) ---`);
    console.log(result.text.slice(0, 1500));
    console.log(`\n--- ${result.pageCount} pages, ${Buffer.byteLength(result.text, "utf8")} bytes total ---`);
    return;
  }

  console.log(`=== v3 OCR + Upload (source=${SOURCE_TAG}) ===`);
  const failed: { chapter_id: string; error: string }[] = [];
  let uploaded = 0;

  for (let idx = 0; idx < chapters.length; idx++) {
    const c = chapters[idx];
    console.log(`\n[${idx + 1}/${chapters.length}] ${c.filename}`);
    try {
      const { text, pageCount } = await processChapter(c);
      const bytes = Buffer.byteLength(text, "utf8");
      console.log(`  extracted ${pageCount} pages, ${bytes} bytes`);

      if (bytes < 100) {
        console.warn(`  ⚠ text too short, skipping upload`);
        failed.push({ chapter_id: c.chapter_id, error: "extracted text < 100 bytes" });
        continue;
      }

      const r = await uploadChapter(c, text, pageCount);
      if (r.ok) {
        uploaded++;
        console.log(`  ✓ uploaded`);
      } else {
        console.error(`  ✗ upload failed: ${r.error}`);
        failed.push({ chapter_id: c.chapter_id, error: r.error ?? "unknown" });
      }
    } catch (e) {
      console.error(`  ✗ chapter failed: ${(e as Error).message}`);
      failed.push({ chapter_id: c.chapter_id, error: (e as Error).message });
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Uploaded: ${uploaded}/${chapters.length}`);
  if (failed.length) {
    console.log(`  Failed: ${failed.length}`);
    failed.forEach((f) => console.log(`    - ${f.chapter_id}: ${f.error}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
