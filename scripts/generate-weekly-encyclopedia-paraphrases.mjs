import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const MODEL = "gemini-3.1-flash-lite";
const PROMPT_VERSION = "weekly-encyclopedia-v2.1";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const INPUT_USD_PER_MILLION = 0.1;
const OUTPUT_USD_PER_MILLION = 0.4;
const ALLOWED_SECTION_CATEGORIES = new Set([
  "baby_development",
  "mother_body",
  "life_guide",
  "caution",
  "faq",
]);

function parseArgs(argv) {
  const options = {
    dryRun: false,
    force: false,
    week: null,
    limit: null,
    outDir: "output/paraphrase",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--week") options.week = Number(argv[++index]);
    else if (arg === "--limit") options.limit = Number(argv[++index]);
    else if (arg === "--out-dir") options.outDir = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function textItems(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.items)) return payload.items.filter(Boolean);
  return [];
}

function estimateCost(usageMetadata) {
  const inputTokens = usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
  return Number(
    (
      (inputTokens / 1_000_000) * INPUT_USD_PER_MILLION +
      (outputTokens / 1_000_000) * OUTPUT_USD_PER_MILLION
    ).toFixed(6),
  );
}

async function fetchWeekSource(client, weekNumber) {
  const weekResult = await client.query(
    `
      SELECT *
      FROM public.content_pregnancy_week_data
      WHERE week_number = $1
      LIMIT 1
    `,
    [weekNumber],
  );
  const week = weekResult.rows[0] ?? null;
  if (!week) return null;

  const days = await client.query(
    `
      SELECT *
      FROM public.content_pregnancy_day_contents
      WHERE week_data_id = $1
      ORDER BY day_number ASC
    `,
    [week.id],
  );
  const checklists = await client.query(
    `
      SELECT *
      FROM public.content_week_checklists
      WHERE week_data_id = $1
        AND is_active = true
      ORDER BY day_number ASC NULLS LAST, display_order ASC, code ASC
    `,
    [week.id],
  );
  const questions = await client.query(
    `
      SELECT *
      FROM public.content_week_questions
      WHERE week_data_id = $1
        AND is_active = true
      ORDER BY day_number ASC NULLS LAST, display_order ASC, code ASC
    `,
    [week.id],
  );

  return {
    week: {
      id: week.id,
      weekNumber: week.week_number,
      title: week.title,
      babySizeLabel: week.baby_size_label,
      babySummary: week.baby_summary,
      motherSummary: week.mother_summary,
      warningSigns: week.warning_signs,
      recommendedActions: week.recommended_actions,
      status: week.status,
    },
    days: days.rows.map((day) => ({
      id: day.id,
      dayNumber: day.day_number,
      title: day.title,
      babyDevelopmentItems: textItems(day.baby_development_payload),
      motherChangesItems: textItems(day.mother_changes_payload),
      babyMessage: day.baby_message,
    })),
    checklists: checklists.rows.map((item) => ({
      id: item.id,
      dayNumber: item.day_number,
      sourceCode: item.code,
      text: item.title,
      description: item.description,
    })),
    questions: questions.rows.map((item) => ({
      id: item.id,
      dayNumber: item.day_number,
      sourceCode: item.code,
      text: item.question_text,
      helpText: item.help_text,
    })),
  };
}

function sourceHasContent(source) {
  if (!source) return false;
  const weekText = [
    source.week.babySummary,
    source.week.motherSummary,
    source.week.warningSigns,
    source.week.recommendedActions,
  ]
    .filter(Boolean)
    .join("");
  const dayText = source.days
    .flatMap((day) => [
      ...day.babyDevelopmentItems,
      ...day.motherChangesItems,
      day.babyMessage,
    ])
    .filter(Boolean)
    .join("");
  return (
    weekText.trim().length > 0 ||
    dayText.trim().length > 0 ||
    source.checklists.length > 0 ||
    source.questions.length > 0
  );
}

function buildPrompt(source, sourceHash) {
  const sourcePayload = {
    sourceReference: {
      weekNumber: source.week.weekNumber,
      sourceHash,
      sourceTables: [
        "public.content_pregnancy_week_data",
        "public.content_pregnancy_day_contents",
        "public.content_week_checklists",
        "public.content_week_questions",
      ],
    },
    source,
  };

  return `너는 한국어 임신백과 콘텐츠 리라이터다. 아래 SOURCE_JSON을 바탕으로 "사용자에게 보여줄 주차별 사전 콘텐츠"만 작성한다.

목표:
- 원문 정보의 의학적 의미, 숫자, 주차, 기간, 증상명은 보존한다.
- 원문 문장 구조와 표현은 강하게 바꾼다.
- day별 문장을 그대로 나열하지 말고, 주차 단위로 다시 구성한다.
- 산모 앱 문체는 따뜻한 -어요/-해요 체다.

강제 규칙:
1. 출력은 JSON만. 마크다운 금지.
2. 사용자 노출 필드에는 sourceText, originalText, rawText 같은 원문 필드를 절대 넣지 않는다.
3. source_trace에는 source_table/source_code/source_hash/source_fields 같은 메타만 넣고 원문 문장은 넣지 않는다.
4. body는 항상 string이다. 배열 금지.
5. baby_message는 life_guide에 섞지 않는다. 필요하면 emotional_note에 1~2문장으로만 요약한다.
6. caution은 위험 신호/의료진 상담 조건만 2~4개 bullet로 제한한다. 일반 몸 변화 반복 금지.
7. 각 section.body는 원문 문장 1개씩 재배열한 목록이 아니라, 새로 쓴 2~4개 단락이어야 한다.
8. 원문과 12어절 이상 연속 동일한 문장이 나오면 실패다.
9. 체크리스트와 질문도 원문 표현을 새로 써라. 다만 dayNumber/sourceCode는 보존한다.
10. 성찰 질문은 짧더라도 원문 질문과 같은 문장 구조를 쓰지 말고, 질문의 관점/표현/어순을 반드시 바꿔라.
11. status는 needs_review.

스키마:
{
  "week_number": number,
  "status": "needs_review",
  "paraphrased_title": string,
  "paraphrased_summary": string,
  "sections": {
    "baby_development": { "title": string, "summary": string, "body": string, "bullets": string[] },
    "mother_body": { "title": string, "summary": string, "body": string, "bullets": string[] },
    "life_guide": { "title": string, "summary": string, "body": string, "bullets": string[] },
    "caution": { "title": string, "summary": string, "body": string, "bullets": string[] },
    "faq": { "title": string, "items": [{ "question": string, "answer": string }] }
  },
  "emotional_note": string,
  "checklist_items": [{ "dayNumber": number, "sourceCode": string, "paraphrasedText": string }],
  "reflection_questions": [{ "dayNumber": number, "sourceCode": string, "paraphrasedText": string }],
  "source_trace": { "weekNumber": number, "sourceTables": string[], "sourceHash": string, "sourceCodes": string[] },
  "review_notes": string[]
}

SOURCE_JSON:
${JSON.stringify(sourcePayload, null, 2)}`;
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is required");

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.15,
          responseMimeType: "application/json",
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });
    const payload = await response.json();
    if (response.ok) {
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return {
        usageMetadata: payload.usageMetadata ?? null,
        output: JSON.parse(text),
      };
    }

    const retryable =
      response.status === 429 ||
      response.status === 500 ||
      response.status === 503;
    if (!retryable || attempt === 5) {
      throw new Error(JSON.stringify(payload));
    }

    const delayMs = 2000 * attempt * attempt;
    console.log(`[retry] Gemini ${response.status}; waiting ${delayMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("Gemini request exhausted retries");
}

function normalizeSectionBody(section) {
  if (!section) return null;
  if (Array.isArray(section.body)) return section.body.join("\n\n");
  return section.body ?? null;
}

function normalizeSectionItems(category, section) {
  if (!section) return [];
  if (category === "faq") return section.items ?? [];
  return section.bullets ?? [];
}

function outputList(output, key) {
  const value = output[key] ?? output.sections?.[key];
  return Array.isArray(value) ? value : [];
}

function itemBase({ source, output, sourceHash, usage, runId }) {
  return {
    run_id: runId,
    source_week_number: output.week_number,
    status: output.status ?? "needs_review",
    is_active: false,
    model: MODEL,
    prompt_version: PROMPT_VERSION,
    source_hash: sourceHash,
  };
}

function buildItems({ source, output, sourceHash, runId }) {
  const base = itemBase({ source, output, sourceHash, runId });
  const items = [];

  items.push({
    ...base,
    source_table: "public.content_pregnancy_week_data",
    source_id: source.week.id,
    source_day_number: null,
    source_code: `w${output.week_number}-overview`,
    content_scope: "week_summary",
    category: "overview",
    title: output.paraphrased_title,
    summary: output.paraphrased_summary,
    body: output.paraphrased_summary,
    items: [],
  });

  for (const [category, section] of Object.entries(output.sections ?? {})) {
    if (!ALLOWED_SECTION_CATEGORIES.has(category)) {
      continue;
    }

    items.push({
      ...base,
      source_table: "public.content_pregnancy_week_data",
      source_id: source.week.id,
      source_day_number: null,
      source_code: `w${output.week_number}-${category}`,
      content_scope: "section",
      category,
      title: section.title ?? null,
      summary: section.summary ?? null,
      body: normalizeSectionBody(section),
      items: normalizeSectionItems(category, section),
    });
  }

  const checklistByCode = new Map(
    source.checklists.map((item) => [item.sourceCode, item]),
  );
  for (const item of outputList(output, "checklist_items")) {
    const sourceItem = checklistByCode.get(item.sourceCode);
    items.push({
      ...base,
      source_table: "public.content_week_checklists",
      source_id: sourceItem?.id ?? null,
      source_day_number: item.dayNumber ?? sourceItem?.dayNumber ?? null,
      source_code: item.sourceCode,
      content_scope: "checklist",
      category: "life_guide",
      title: null,
      summary: null,
      body: item.paraphrasedText ?? null,
      items: [{ dayNumber: item.dayNumber, sourceCode: item.sourceCode }],
      source_hash: sha256(
        stableJson({ text: sourceItem?.text, description: sourceItem?.description }),
      ),
    });
  }

  const questionByCode = new Map(
    source.questions.map((item) => [item.sourceCode, item]),
  );
  for (const item of outputList(output, "reflection_questions")) {
    const sourceItem = questionByCode.get(item.sourceCode);
    items.push({
      ...base,
      source_table: "public.content_week_questions",
      source_id: sourceItem?.id ?? null,
      source_day_number: item.dayNumber ?? sourceItem?.dayNumber ?? null,
      source_code: item.sourceCode,
      content_scope: "question",
      category: "reflection_question",
      title: null,
      summary: null,
      body: item.paraphrasedText ?? null,
      items: [{ dayNumber: item.dayNumber, sourceCode: item.sourceCode }],
      source_hash: sha256(stableJson({ text: sourceItem?.text })),
    });
  }

  return items;
}

async function insertRunAndItems(client, { source, sourceHash, usageMetadata, output }) {
  await client.query("BEGIN");
  try {
    const runResult = await client.query(
      `
        INSERT INTO public.content_paraphrase_runs (
          model,
          prompt_version,
          scope,
          target_week_number,
          status,
          input_token_count,
          output_token_count,
          total_token_count,
          cost_usd,
          completed_at
        )
        VALUES ($1, $2, 'week', $3, 'completed', $4, $5, $6, $7, timezone('utc', now()))
        RETURNING id
      `,
      [
        MODEL,
        PROMPT_VERSION,
        source.week.weekNumber,
        usageMetadata?.promptTokenCount ?? null,
        usageMetadata?.candidatesTokenCount ?? null,
        usageMetadata?.totalTokenCount ?? null,
        estimateCost(usageMetadata),
      ],
    );
    const runId = runResult.rows[0].id;
    const items = buildItems({ source, output, sourceHash, runId });

    for (const item of items) {
      await client.query(
        `
          INSERT INTO public.content_paraphrased_items (
            source_table,
            source_id,
            source_week_number,
            source_day_number,
            source_code,
            source_hash,
            run_id,
            content_scope,
            category,
            title,
            summary,
            body,
            items,
            status,
            is_active,
            model,
            prompt_version
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13::jsonb, $14, $15, $16, $17
          )
        `,
        [
          item.source_table,
          item.source_id,
          item.source_week_number,
          item.source_day_number,
          item.source_code,
          item.source_hash,
          item.run_id,
          item.content_scope,
          item.category,
          item.title,
          item.summary,
          item.body,
          JSON.stringify(item.items ?? []),
          item.status,
          item.is_active,
          item.model,
          item.prompt_version,
        ],
      );
    }

    await client.query("COMMIT");
    return { runId, itemCount: items.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function alreadyGenerated(client, weekNumber, sourceHash) {
  const result = await client.query(
    `
      SELECT 1
      FROM public.content_paraphrased_items
      WHERE source_week_number = $1
        AND source_hash = $2
        AND prompt_version = $3
      LIMIT 1
    `,
    [weekNumber, sourceHash, PROMPT_VERSION],
  );
  return result.rowCount > 0;
}

async function listWeekNumbers(client, options) {
  const result = await client.query(
    `
      SELECT week_number
      FROM public.content_pregnancy_week_data
      WHERE week_number BETWEEN 1 AND 40
      ORDER BY week_number ASC
    `,
  );
  let weeks = result.rows.map((row) => row.week_number);
  if (options.week) weeks = weeks.filter((week) => week === options.week);
  if (options.limit) weeks = weeks.slice(0, options.limit);
  return weeks;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  fs.mkdirSync(options.outDir, { recursive: true });
  const client = new Client({ connectionString });
  await client.connect();

  const summary = {
    startedAt: new Date().toISOString(),
    model: MODEL,
    promptVersion: PROMPT_VERSION,
    dryRun: options.dryRun,
    force: options.force,
    weeks: [],
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
  };

  try {
    const weekNumbers = await listWeekNumbers(client, options);
    for (const weekNumber of weekNumbers) {
      const source = await fetchWeekSource(client, weekNumber);
      if (!sourceHasContent(source)) {
        summary.weeks.push({ weekNumber, status: "skipped_empty" });
        console.log(`[skip] week ${weekNumber}: no source content`);
        continue;
      }

      const sourceHash = sha256(stableJson(source));
      if (!options.force && (await alreadyGenerated(client, weekNumber, sourceHash))) {
        summary.weeks.push({ weekNumber, status: "skipped_existing", sourceHash });
        console.log(`[skip] week ${weekNumber}: existing ${PROMPT_VERSION} source hash`);
        continue;
      }

      if (options.dryRun) {
        summary.weeks.push({ weekNumber, status: "dry_run", sourceHash });
        console.log(`[dry-run] week ${weekNumber}: ${sourceHash}`);
        continue;
      }

      console.log(`[run] week ${weekNumber}`);
      const prompt = buildPrompt(source, sourceHash);
      const { usageMetadata, output } = await callGemini(prompt);
      if (output.week_number !== weekNumber) {
        throw new Error(`Gemini output week mismatch: expected ${weekNumber}, got ${output.week_number}`);
      }
      const insertResult = await insertRunAndItems(client, {
        source,
        sourceHash,
        usageMetadata,
        output,
      });

      const artifactPath = path.join(
        options.outDir,
        `week-${String(weekNumber).padStart(2, "0")}-${PROMPT_VERSION}.json`,
      );
      fs.writeFileSync(
        artifactPath,
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            model: MODEL,
            promptVersion: PROMPT_VERSION,
            sourceHash,
            usageMetadata,
            output,
            insertResult,
          },
          null,
          2,
        ),
      );

      const inputTokens = usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
      const costUsd = estimateCost(usageMetadata);
      summary.totalInputTokens += inputTokens;
      summary.totalOutputTokens += outputTokens;
      summary.totalCostUsd = Number((summary.totalCostUsd + costUsd).toFixed(6));
      summary.weeks.push({
        weekNumber,
        status: "inserted",
        sourceHash,
        runId: insertResult.runId,
        itemCount: insertResult.itemCount,
        inputTokens,
        outputTokens,
        costUsd,
        artifactPath,
      });
      console.log(
        `[done] week ${weekNumber}: ${insertResult.itemCount} items, ${inputTokens}/${outputTokens} tokens, $${costUsd}`,
      );
    }
  } finally {
    summary.completedAt = new Date().toISOString();
    const summaryPath = path.join(options.outDir, `summary-${PROMPT_VERSION}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`[summary] ${summaryPath}`);
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
