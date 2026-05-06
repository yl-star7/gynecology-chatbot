/**
 * Track A — content_paraphrased_items (v2.1, active) → Schift "pregnancy-knowledge-v2"
 *
 * 주차별/카테고리별로 .txt 파일을 만들어 단일 v2 버킷에 업로드한다.
 * 메타: surface=paraphrased, week=N(or scope=common), category, content_scope, lang=ko
 *
 * Usage:
 *   DRY_RUN=1  pnpm tsx scripts/rebuild-schift-from-paraphrased.ts
 *   ALLOW_NONEMPTY=1  pnpm tsx scripts/rebuild-schift-from-paraphrased.ts   # 버킷 비어있지 않아도 진행
 *
 * 환경변수:
 *   DATABASE_URL          CloudSQL 접속 URL (필수)
 *   SCHIFT_API_KEY        Schift API key (필수)
 *   BUCKET                기본 "pregnancy-knowledge-v2"
 *   PROMPT_VERSION        기본 "weekly-encyclopedia-v2.1"
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";
import pg from "pg";

const SCHIFT_API_KEY = process.env.SCHIFT_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const BUCKET = process.env.BUCKET ?? "pregnancy-knowledge-v2";
const PROMPT_VERSION = process.env.PROMPT_VERSION ?? "weekly-encyclopedia-v2.1";
const DRY_RUN = process.env.DRY_RUN === "1";
const ALLOW_NONEMPTY = process.env.ALLOW_NONEMPTY === "1";

if (!SCHIFT_API_KEY) {
  console.error("SCHIFT_API_KEY is required");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

type Row = {
  source_week_number: number | null;
  source_day_number: number | null;
  content_scope: string;
  category: string;
  source_code: string | null;
  title: string | null;
  summary: string | null;
  body: string | null;
  items: unknown;
};

type Group = {
  filename: string;
  text: string;
  metadata: Record<string, string>;
};

function safeStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function bulletsFromItems(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((x) => {
      if (typeof x === "string") return x.trim();
      if (x && typeof x === "object") {
        const obj = x as Record<string, unknown>;
        if (
          typeof obj.question === "string" &&
          typeof obj.answer === "string"
        ) {
          return `Q. ${obj.question}\n   A. ${obj.answer}`;
        }
        if (typeof obj.text === "string") return obj.text.trim();
      }
      return "";
    })
    .filter(Boolean);
}

function buildSectionText(rows: Row[]): string {
  const r = rows[0];
  const lines: string[] = [];
  if (safeStr(r.title)) lines.push(`# ${safeStr(r.title)}`);
  if (safeStr(r.summary)) lines.push("", safeStr(r.summary));
  if (safeStr(r.body)) lines.push("", safeStr(r.body));
  const bullets = bulletsFromItems(r.items);
  if (bullets.length > 0) {
    lines.push("");
    for (const b of bullets) lines.push(`- ${b}`);
  }
  return lines.join("\n").trim();
}

function buildOverviewText(rows: Row[]): string {
  const r = rows[0];
  const lines: string[] = [];
  if (safeStr(r.title)) lines.push(`# ${safeStr(r.title)}`);
  if (safeStr(r.summary)) lines.push("", safeStr(r.summary));
  if (safeStr(r.body) && r.body !== r.summary) lines.push("", safeStr(r.body));
  return lines.join("\n").trim();
}

function buildChecklistText(week: number, rows: Row[]): string {
  const lines: string[] = [`# 임신 ${week}주차 생활 체크리스트`, ""];
  const byDay = new Map<number, Row[]>();
  for (const r of rows) {
    const d = r.source_day_number ?? 0;
    const list = byDay.get(d) ?? [];
    list.push(r);
    byDay.set(d, list);
  }
  const dayKeys = Array.from(byDay.keys()).sort((a, b) => a - b);
  for (const day of dayKeys) {
    if (day > 0) lines.push(`## ${day}일차`);
    for (const r of byDay.get(day)!) {
      if (safeStr(r.body)) lines.push(`- ${safeStr(r.body)}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

function buildQuestionText(week: number, rows: Row[]): string {
  const lines: string[] = [`# 임신 ${week}주차 성찰 질문`, ""];
  const byDay = new Map<number, Row[]>();
  for (const r of rows) {
    const d = r.source_day_number ?? 0;
    const list = byDay.get(d) ?? [];
    list.push(r);
    byDay.set(d, list);
  }
  const dayKeys = Array.from(byDay.keys()).sort((a, b) => a - b);
  for (const day of dayKeys) {
    if (day > 0) lines.push(`## ${day}일차`);
    for (const r of byDay.get(day)!) {
      if (safeStr(r.body)) lines.push(`- ${safeStr(r.body)}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

function buildGroups(rows: Row[]): Group[] {
  const groups: Group[] = [];

  const weekScope = new Map<string, Row[]>();
  const commonScope = new Map<string, Row[]>();
  const keyOf = (r: Row) => `${r.content_scope}/${r.category}`;

  for (const r of rows) {
    const week = r.source_week_number;
    if (week == null) {
      const k = keyOf(r);
      const list = commonScope.get(k) ?? [];
      list.push(r);
      commonScope.set(k, list);
    } else {
      const k = `w${week}|${keyOf(r)}`;
      const list = weekScope.get(k) ?? [];
      list.push(r);
      weekScope.set(k, list);
    }
  }

  for (const [k, list] of weekScope) {
    const [wTok, scope, category] = k.split(/[|/]/);
    const week = Number(wTok.replace(/^w/, ""));
    let text = "";
    let filename = "";
    if (scope === "week_summary") {
      text = buildOverviewText(list);
      filename = `week-${week}-overview.txt`;
    } else if (scope === "section") {
      text = buildSectionText(list);
      filename = `week-${week}-${category}.txt`;
    } else if (scope === "checklist") {
      text = buildChecklistText(week, list);
      filename = `week-${week}-checklist.txt`;
    } else if (scope === "question") {
      text = buildQuestionText(week, list);
      filename = `week-${week}-questions.txt`;
    } else {
      continue;
    }
    if (!text) continue;
    groups.push({
      filename,
      text,
      metadata: {
        surface: "paraphrased",
        week: String(week),
        scope,
        category,
        lang: "ko",
        prompt_version: PROMPT_VERSION,
      },
    });
  }

  for (const [k, list] of commonScope) {
    const [scope, category] = k.split("/");
    let text = "";
    if (scope === "section") text = buildSectionText(list);
    else if (scope === "week_summary") text = buildOverviewText(list);
    else continue;
    if (!text) continue;
    groups.push({
      filename: `common-${scope}-${category}.txt`,
      text,
      metadata: {
        surface: "paraphrased",
        scope,
        category,
        scope_label: "common",
        lang: "ko",
        prompt_version: PROMPT_VERSION,
      },
    });
  }

  groups.sort((a, b) => a.filename.localeCompare(b.filename));
  return groups;
}

async function fetchBucketState(): Promise<{
  exists: boolean;
  fileCount: number;
} | null> {
  const res = await fetch("https://api.schift.io/v1/buckets", {
    headers: { Authorization: `Bearer ${SCHIFT_API_KEY}` },
  });
  if (!res.ok) return null;
  const buckets = (await res.json()) as Array<{
    name: string;
    file_count?: number;
    active_job_count?: number;
  }>;
  const found = buckets.find((b) => b.name === BUCKET);
  if (!found) return { exists: false, fileCount: 0 };
  return { exists: true, fileCount: found.file_count ?? 0 };
}

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const result = await pool.query<Row>(
    `SELECT source_week_number, source_day_number, content_scope, category, source_code,
            title, summary, body, items
       FROM public.content_paraphrased_items
      WHERE prompt_version = $1
        AND is_active = true
        AND body IS NOT NULL
        AND length(body) > 0
      ORDER BY source_week_number NULLS LAST, content_scope, category, source_day_number, source_code`,
    [PROMPT_VERSION],
  );
  await pool.end();
  console.log(`Fetched ${result.rows.length} active paraphrased rows`);

  const groups = buildGroups(result.rows);
  const totalBytes = groups.reduce(
    (acc, g) => acc + Buffer.byteLength(g.text),
    0,
  );
  console.log(
    `Built ${groups.length} files (${(totalBytes / 1024).toFixed(1)} KB)`,
  );

  const bucketState = await fetchBucketState();
  if (bucketState == null) {
    console.warn("Bucket state check failed (continuing)");
  } else if (bucketState.exists) {
    console.log(
      `Bucket "${BUCKET}" already exists with ${bucketState.fileCount} files`,
    );
    if (bucketState.fileCount > 0 && !ALLOW_NONEMPTY) {
      console.error(
        "Refusing to upload to non-empty bucket. Use ALLOW_NONEMPTY=1 to override.",
      );
      process.exit(1);
    }
  } else {
    console.log(`Bucket "${BUCKET}" will be created on first upload`);
  }

  const sample = groups.slice(0, 5);
  console.log("\nSample files:");
  for (const g of sample) {
    console.log(
      `  ${g.filename} (${Buffer.byteLength(g.text)}B) meta=${JSON.stringify(g.metadata)}`,
    );
  }

  if (DRY_RUN) {
    console.log("\nDRY_RUN=1 — upload skipped");
    return;
  }

  const schift = new Schift({ apiKey: SCHIFT_API_KEY! });
  let uploaded = 0;
  let failed = 0;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const file = new File(
      [new Blob([g.text], { type: "text/plain; charset=utf-8" })],
      g.filename,
      { type: "text/plain" },
    );
    let retries = 3;
    while (retries > 0) {
      try {
        await schift.db.upload(BUCKET, { files: [file], metadata: g.metadata });
        uploaded++;
        if (uploaded % 10 === 0 || i === groups.length - 1) {
          console.log(`  [${i + 1}/${groups.length}] ${g.filename} uploaded`);
        }
        break;
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.includes("429") && retries > 1) {
          retries--;
          console.log(`  rate limited, sleeping 15s (${retries} retries left)`);
          await sleep(15000);
        } else {
          failed++;
          console.error(`  ✗ ${g.filename}: ${msg}`);
          break;
        }
      }
    }
    await sleep(800);
  }

  console.log(
    `\nDone: uploaded=${uploaded} failed=${failed} of ${groups.length}`,
  );
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
