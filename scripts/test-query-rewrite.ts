/**
 * Query rewrite + dual-channel retrieval 검증.
 *
 * 1) 사용자 colloquial query 를 임상 학술어로 확장
 * 2) 확장된 query 로 weekly + common(v3) 채널 retrieve
 * 3) 결과 비교 (with vs without rewrite)
 *
 * Usage: pnpm tsx scripts/test-query-rewrite.ts
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";

const SHELL_GEMINI = process.env.GEMINI_API_KEY;
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env"), override: true });
if (SHELL_GEMINI) process.env.GEMINI_API_KEY = SHELL_GEMINI;

const SCHIFT_API_KEY = process.env.SCHIFT_API_KEY!;
const SCHIFT_API_URL = process.env.SCHIFT_API_URL ?? "https://api.schift.io";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const BUCKET_ID =
  process.env.BUCKET_ID ?? "a0275a3e30d747ddb1a35f2cd56ae8ad";

async function rewriteQuery(query: string, week: number | null): Promise<string> {
  const weekHint = week != null ? `\n현재 임신 주차: ${week}주차.` : "";
  const prompt = `다음 한국어 임산부 발화를 한국어 임상/학술 용어로 확장한 검색 쿼리로 변환하세요. 원래 의도를 보존하며 전문 의학 용어와 영문 약어(있다면)를 함께 포함합니다. 설명 없이 확장된 검색 쿼리 한 줄만 반환하세요.${weekHint}

발화: ${query}
검색 쿼리:`;
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
      }),
    },
  );
  if (!resp.ok) throw new Error(`gemini ${resp.status}`);
  const json = (await resp.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const t = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return `${query} ${t ?? ""}`.trim();
}

async function search(
  query: string,
  filter: Record<string, string>,
  topK = 3,
): Promise<Array<{ score: number; metadata?: Record<string, unknown>; text?: string }>> {
  const resp = await fetch(
    `${SCHIFT_API_URL}/v1/buckets/${BUCKET_ID}/search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SCHIFT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, top_k: topK, filter }),
    },
  );
  if (!resp.ok) throw new Error(`schift ${resp.status}`);
  const json = (await resp.json()) as {
    results?: Array<{
      score: number;
      metadata?: Record<string, unknown>;
      text?: string;
    }>;
  };
  return json.results ?? [];
}

function summarize(
  label: string,
  results: Array<{ score: number; metadata?: Record<string, unknown>; text?: string }>,
) {
  console.log(`  ${label}:`);
  for (const r of results.slice(0, 3)) {
    const md = r.metadata ?? {};
    const surface = md.surface ?? "?";
    const chapter = md.chapter ?? md.file_name ?? "?";
    const txt = (r.text ?? (md.text as string) ?? "").slice(0, 90);
    console.log(`    score=${r.score.toFixed(3)} surface=${surface} chapter/file=${chapter}`);
    console.log(`      ${txt}`);
  }
  if (results.length === 0) console.log(`    (no results)`);
}

async function runCase(query: string, week: number | null) {
  console.log("=".repeat(80));
  console.log(`Query: ${query}  (week=${week ?? "?"})`);
  console.log("=".repeat(80));

  const expanded = await rewriteQuery(query, week);
  console.log(`Rewritten: ${expanded}`);
  console.log();

  // Original query — common channel only (apples-to-apples)
  console.log("▶ Original query");
  const origCommon = await search(query, {
    surface: "common",
    source: "catholic_si_textbook_v3",
  });
  summarize("common", origCommon);

  // Rewritten query — common channel
  console.log();
  console.log("▶ Rewritten query");
  const rewCommon = await search(expanded, {
    surface: "common",
    source: "catholic_si_textbook_v3",
  });
  summarize("common", rewCommon);
  console.log();
}

async function main() {
  await runCase("32주차에 조기진통 같은 느낌이 있어요", 32);
  await runCase("아기 머리가 짓눌린 것처럼 보여요", null);
  await runCase("분만 후 출혈이 멈추지 않아요", null);
  await runCase("배가 너무 땡기고 아파요", 28);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
