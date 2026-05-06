import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import pg from "pg";

const TEXTBOOK_DIR =
  process.env.TEXTBOOK_DIR ?? "/Users/jskang/Downloads/가톨릭 SI 자료/Data";
const SOURCE = process.env.TEXTBOOK_SOURCE ?? "catholic_si_textbook_v3";
const BUCKET = process.env.SCHIFT_BUCKET ?? "pregnancy-knowledge";
const DRY_RUN = process.env.DRY_RUN === "1";
const FORCE = process.env.FORCE === "1";
const EMBED_CHARS = Number.parseInt(process.env.EMBED_CHARS ?? "12000", 10);
const EMBEDDING_DIMENSION = 1024;
const SCHIFT_EMBEDDINGS_URL =
  process.env.SCHIFT_EMBEDDINGS_URL ?? "https://embed.schift.io/embeddings";

type GoogleEmbeddingClient = {
  models: {
    embedContent(input: {
      model: string;
      contents: string;
      config: { outputDimensionality: number };
    }): Promise<{ embeddings?: Array<{ values?: number[] }> }>;
  };
};

type SchiftClient = {
  embed(input: { text: string }): Promise<{ embedding: number[] }>;
};

async function createGenaiClient(apiKey: string): Promise<GoogleEmbeddingClient> {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey });
}

async function createSchiftClient(apiKey: string): Promise<SchiftClient> {
  const { Schift } = await import("@schift-io/sdk");
  return new Schift({ apiKey });
}

const rawDatabaseUrl = process.env.PROD_DATABASE_URL ?? process.env.DATABASE_URL;
if (!rawDatabaseUrl) {
  console.error("PROD_DATABASE_URL or DATABASE_URL is required");
  process.exit(1);
}
if (
  !process.env.SCHIFT_API_KEY &&
  !process.env.GEMINI_API_KEY &&
  !process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
  !DRY_RUN
) {
  console.error(
    "SCHIFT_API_KEY or GEMINI_API_KEY/GOOGLE_GENERATIVE_AI_API_KEY is required unless DRY_RUN=1",
  );
  process.exit(1);
}

type Chapter = {
  id: string;
  fileId: string;
  documentId: string;
  filename: string;
  displayFilename: string;
  textFilename: string;
  chapter: string;
  unit: string;
  section: string;
  pages: string;
  pageStart: number;
  pageEnd: number;
  fileSize: number;
  pdfPath: string;
  title: string;
  storagePath: string;
};

function databaseUrl() {
  const url = new URL(rawDatabaseUrl);
  url.search = "";
  if (process.env.DB_HOST) url.hostname = process.env.DB_HOST;
  if (process.env.DB_PORT) url.port = process.env.DB_PORT;
  return url.toString();
}

function deterministicUuid(input: string) {
  const bytes = crypto.createHash("sha1").update(input).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function parseChapterFilename(rawFilename: string) {
  const filename = rawFilename.normalize("NFC");
  const match = filename.match(
    /^(\d+)_(Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|Ⅵ|Ⅶ|Ⅷ|Ⅸ|Ⅹ)_([\d-]+)장\((\d+)[~-](\d+)\)\.pdf$/u,
  );
  if (!match) return null;
  const [, unit, section, chapter, pageStart, pageEnd] = match;
  return {
    unit,
    section,
    chapter: `${unit}_${section}_${chapter}`,
    pages: `${pageStart}-${pageEnd}`,
    pageStart: Number.parseInt(pageStart, 10),
    pageEnd: Number.parseInt(pageEnd, 10),
  };
}

function loadChapters(): Chapter[] {
  return fs
    .readdirSync(TEXTBOOK_DIR)
    .filter((filename) => filename.endsWith(".pdf"))
    .map((filename) => {
      const parsed = parseChapterFilename(filename);
      if (!parsed) return null;
      const pdfPath = path.join(TEXTBOOK_DIR, filename);
      const textFilename = `${parsed.chapter}__${parsed.pages}.txt`;
      const fileId = deterministicUuid(`${SOURCE}:file:${parsed.chapter}`);
      const documentId = deterministicUuid(`${SOURCE}:document:${parsed.chapter}`);
      return {
        ...parsed,
        id: parsed.chapter,
        fileId,
        documentId,
        filename,
        displayFilename: filename.normalize("NFC"),
        textFilename,
        fileSize: fs.statSync(pdfPath).size,
        pdfPath,
        title: `가톨릭 SI 교과서 ${parsed.chapter}장 (${parsed.pages}쪽)`,
        storagePath: `schift://${BUCKET}/${SOURCE}/${textFilename}`,
      };
    })
    .filter((chapter): chapter is Chapter => Boolean(chapter))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function extractText(chapter: Chapter) {
  const out = path.join(os.tmpdir(), `si-textbook-${chapter.id}-${process.pid}.txt`);
  try {
    execFileSync("pdftotext", ["-layout", chapter.pdfPath, out], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    const text = fs.readFileSync(out, "utf8").trim();
    return [
      `# ${chapter.title}`,
      "",
      `source=${SOURCE}`,
      `chapter=${chapter.chapter}`,
      `pages=${chapter.pages}`,
      "",
      text,
    ].join("\n");
  } finally {
    fs.rmSync(out, { force: true });
  }
}

function vectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

async function embed(input: {
  schift: SchiftClient | null;
  gemini: GoogleEmbeddingClient | null;
  title: string;
  content: string;
}) {
  const text = `${input.title}\n\n${input.content}`.slice(0, EMBED_CHARS);
  let rawEmbedding: number[] | null = null;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.SCHIFT_API_KEY) {
      headers.Authorization = `Bearer ${process.env.SCHIFT_API_KEY}`;
    }
    const response = await fetch(SCHIFT_EMBEDDINGS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ input: [text], dimensions: EMBEDDING_DIMENSION }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };
    rawEmbedding = payload.data?.[0]?.embedding ?? null;
    if (!rawEmbedding) {
      throw new Error("missing embedding");
    }
  } catch (endpointError) {
    console.warn(
      `Schift embeddings endpoint failed; trying SDK/Gemini fallback: ${
        (endpointError as Error).message
      }`,
    );
  }

  if (!rawEmbedding && input.schift) {
    try {
      const result = await input.schift.embed({ text });
      rawEmbedding = result.embedding;
    } catch (sdkError) {
      console.warn(
        `Schift SDK embed failed; falling back to Gemini: ${
          (sdkError as Error).message
        }`,
      );
    }
  }

  if (!rawEmbedding && input.gemini) {
    const response = await input.gemini.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
      config: { outputDimensionality: EMBEDDING_DIMENSION },
    });
    rawEmbedding = response.embeddings?.[0]?.values ?? null;
  }

  if (!rawEmbedding) {
    throw new Error("No embedding provider available");
  }

  const embedding = rawEmbedding.slice(0, EMBEDDING_DIMENSION);
  while (embedding.length < EMBEDDING_DIMENSION) embedding.push(0);
  return embedding;
}

async function existingCounts(pool: pg.Pool) {
  const { rows } = await pool.query<{
    files: string;
    docs: string;
  }>(
    `select
       (select count(*) from content_rag_files where schift_bucket = $1 and storage_path like $2) as files,
       (select count(*) from content_pregnancy_documents where metadata->>'source' = $3) as docs`,
    [BUCKET, `schift://${BUCKET}/${SOURCE}/%`, SOURCE],
  );
  return {
    files: Number(rows[0]?.files ?? 0),
    docs: Number(rows[0]?.docs ?? 0),
  };
}

async function upsertFile(pool: pg.Pool, chapter: Chapter) {
  const query = FORCE
    ? `insert into content_rag_files
        (id, filename, storage_path, schift_bucket, file_size, mime_type, status, enabled, error_message, uploaded_by, created_at, updated_at)
       values ($1, $2, $3, $4, $5, 'text/plain', 'ready', true, null, null, now(), now())
       on conflict (id) do update set
        filename = excluded.filename,
        storage_path = excluded.storage_path,
        schift_bucket = excluded.schift_bucket,
        file_size = excluded.file_size,
        mime_type = excluded.mime_type,
        status = excluded.status,
        enabled = excluded.enabled,
        updated_at = now()`
    : `insert into content_rag_files
        (id, filename, storage_path, schift_bucket, file_size, mime_type, status, enabled, error_message, uploaded_by, created_at, updated_at)
       values ($1, $2, $3, $4, $5, 'text/plain', 'ready', true, null, null, now(), now())
       on conflict (id) do nothing`;

  await pool.query(query, [
    chapter.fileId,
    chapter.textFilename,
    chapter.storagePath,
    BUCKET,
    chapter.fileSize,
  ]);
}

async function upsertDocument(
  pool: pg.Pool,
  chapter: Chapter,
  content: string,
  embedding: number[],
) {
  const metadata = {
    chunk_count: 1,
    draft: false,
    source: SOURCE,
    fileId: chapter.fileId,
    filename: chapter.textFilename,
    sourceFilename: chapter.textFilename,
    source_file_id: chapter.fileId,
    source_pdf: chapter.displayFilename,
    schift_bucket: BUCKET,
    storage_path: chapter.storagePath,
    chapter: chapter.chapter,
    unit: chapter.unit,
    section: chapter.section,
    pages: chapter.pages,
    page_start: chapter.pageStart,
    page_end: chapter.pageEnd,
    surface: "common",
    lang: "ko",
    backfilled_at: new Date().toISOString(),
  };

  const query = FORCE
    ? `insert into content_pregnancy_documents
        (id, title, content, pregnancy_week, category, image_url, embedding, metadata, created_at, updated_at)
       values ($1::uuid, $2, $3, null, 'textbook', null, $4::vector, $5::jsonb, now(), now())
       on conflict (id) do update set
        title = excluded.title,
        content = excluded.content,
        category = excluded.category,
        embedding = excluded.embedding,
        metadata = excluded.metadata,
        updated_at = now()`
    : `insert into content_pregnancy_documents
        (id, title, content, pregnancy_week, category, image_url, embedding, metadata, created_at, updated_at)
       values ($1::uuid, $2, $3, null, 'textbook', null, $4::vector, $5::jsonb, now(), now())
       on conflict (id) do nothing`;

  await pool.query(query, [
    chapter.documentId,
    chapter.title,
    content,
    vectorLiteral(embedding),
    JSON.stringify(metadata),
  ]);
}

async function main() {
  const chapters = loadChapters();
  console.log(`Found ${chapters.length} textbook chapters in ${TEXTBOOK_DIR}`);
  for (const chapter of chapters) {
    console.log(`  ${chapter.textFilename} <- ${chapter.displayFilename}`);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl() });
  try {
    const before = await existingCounts(pool);
    console.log(
      `Existing backfill rows: files=${before.files}, documents=${before.docs}`,
    );

    if (DRY_RUN) {
      console.log("DRY_RUN=1: no rows will be written.");
      return;
    }

    const schift = process.env.SCHIFT_API_KEY
      ? await createSchiftClient(process.env.SCHIFT_API_KEY)
      : null;
    const geminiKey =
      process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const gemini = geminiKey ? await createGenaiClient(geminiKey) : null;
    let written = 0;
    for (const [index, chapter] of chapters.entries()) {
      console.log(`[${index + 1}/${chapters.length}] ${chapter.id}`);
      const content = extractText(chapter);
      if (content.length < 500) {
        throw new Error(`Extracted content is too short: ${chapter.id}`);
      }
      const embedding = await embed({
        schift,
        gemini,
        title: chapter.title,
        content,
      });
      await upsertFile(pool, chapter);
      await upsertDocument(pool, chapter, content, embedding);
      written += 1;
    }

    const after = await existingCounts(pool);
    console.log(
      `Backfill complete: processed=${written}, files=${after.files}, documents=${after.docs}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
