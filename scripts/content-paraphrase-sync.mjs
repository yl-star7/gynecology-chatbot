import crypto from "node:crypto";
import fs from "node:fs";

const STANDARD_INPUT_USD_PER_MILLION = 0.1;
const STANDARD_OUTPUT_USD_PER_MILLION = 0.4;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function toSqlString(value) {
  if (value == null) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function toSqlJson(value) {
  return `${toSqlString(JSON.stringify(value ?? []))}::jsonb`;
}

function normalizeBody(body) {
  if (Array.isArray(body)) return body.join("\n\n");
  return body ?? null;
}

export function estimateGeminiFlashLiteCostUsd(usageMetadata) {
  const inputTokens = usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
  return Number(
    (
      (inputTokens / 1_000_000) * STANDARD_INPUT_USD_PER_MILLION +
      (outputTokens / 1_000_000) * STANDARD_OUTPUT_USD_PER_MILLION
    ).toFixed(6),
  );
}

function makeBaseItem(artifact, options) {
  const output = artifact.output;
  return {
    sourceWeekNumber: output.week_number,
    status: output.status ?? "needs_review",
    isActive: false,
    model: artifact.model ?? "gemini-3.1-flash-lite-preview",
    promptVersion: options.promptVersion,
  };
}

export function buildParaphraseRows(
  artifact,
  options = { promptVersion: "weekly-encyclopedia-v1" },
) {
  const output = artifact.output;
  const base = makeBaseItem(artifact, options);
  const items = [];

  const run = {
    model: artifact.model ?? "gemini-3.1-flash-lite-preview",
    promptVersion: options.promptVersion,
    scope: "week",
    targetWeekNumber: output.week_number,
    status: "completed",
    inputTokenCount: artifact.usageMetadata?.promptTokenCount ?? null,
    outputTokenCount: artifact.usageMetadata?.candidatesTokenCount ?? null,
    totalTokenCount: artifact.usageMetadata?.totalTokenCount ?? null,
    costUsd: estimateGeminiFlashLiteCostUsd(artifact.usageMetadata),
  };

  items.push({
    ...base,
    sourceTable: "content.pregnancy_week_data",
    sourceId: null,
    sourceDayNumber: null,
    sourceCode: `w${output.week_number}-overview`,
    sourceHash: sha256(
      JSON.stringify({
        title: output.paraphrased_title,
        summary: output.paraphrased_summary,
      }),
    ),
    contentScope: "week_summary",
    category: "overview",
    title: output.paraphrased_title,
    summary: output.paraphrased_summary,
    body: output.paraphrased_summary,
    items: [],
  });

  for (const [category, section] of Object.entries(output.sections ?? {})) {
    items.push({
      ...base,
      sourceTable: "content.pregnancy_week_data",
      sourceId: null,
      sourceDayNumber: null,
      sourceCode: `w${output.week_number}-${category}`,
      sourceHash: sha256(JSON.stringify(section)),
      contentScope: "section",
      category,
      title: section.title ?? null,
      summary: section.summary ?? null,
      body: normalizeBody(section.body),
      items: section.bullets ?? [],
    });
  }

  for (const [index, checklist] of (output.checklist_items ?? []).entries()) {
    items.push({
      ...base,
      sourceTable: "content.week_checklists",
      sourceId: null,
      sourceDayNumber: checklist.dayNumber ?? null,
      sourceCode: `w${output.week_number}-d${checklist.dayNumber ?? "x"}-cl-${index + 1}`,
      sourceHash: sha256(checklist.sourceText ?? checklist.paraphrasedText ?? ""),
      contentScope: "checklist",
      category: "life_guide",
      title: null,
      summary: null,
      body: checklist.paraphrasedText ?? null,
      items: [checklist],
    });
  }

  for (const [index, question] of (output.reflection_questions ?? []).entries()) {
    items.push({
      ...base,
      sourceTable: "content.week_questions",
      sourceId: null,
      sourceDayNumber: question.dayNumber ?? null,
      sourceCode: `w${output.week_number}-d${question.dayNumber ?? "x"}-q-${index + 1}`,
      sourceHash: sha256(question.sourceText ?? question.paraphrasedText ?? ""),
      contentScope: "question",
      category: "reflection_question",
      title: null,
      summary: null,
      body: question.paraphrasedText ?? null,
      items: [question],
    });
  }

  return { run, items };
}

function runInsertSql(run) {
  return `INSERT INTO public.content_paraphrase_runs (
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
) VALUES (
  ${toSqlString(run.model)},
  ${toSqlString(run.promptVersion)},
  ${toSqlString(run.scope)},
  ${run.targetWeekNumber ?? "NULL"},
  ${toSqlString(run.status)},
  ${run.inputTokenCount ?? "NULL"},
  ${run.outputTokenCount ?? "NULL"},
  ${run.totalTokenCount ?? "NULL"},
  ${run.costUsd ?? "NULL"},
  timezone('utc', now())
) RETURNING id`;
}

function itemRowSql(item) {
  return `(
    ${toSqlString(item.sourceTable)},
    ${item.sourceId ? toSqlString(item.sourceId) : "NULL"},
    ${item.sourceWeekNumber},
    ${item.sourceDayNumber ?? "NULL"},
    ${toSqlString(item.sourceCode)},
    ${toSqlString(item.sourceHash)},
    (SELECT id FROM inserted_run),
    ${toSqlString(item.contentScope)},
    ${toSqlString(item.category)},
    ${toSqlString(item.title)},
    ${toSqlString(item.summary)},
    ${toSqlString(item.body)},
    ${toSqlJson(item.items)},
    ${toSqlString(item.status)},
    ${item.isActive ? "true" : "false"},
    ${toSqlString(item.model)},
    ${toSqlString(item.promptVersion)}
  )`;
}

export function buildParaphraseSql(
  artifact,
  options = { promptVersion: "weekly-encyclopedia-v1" },
) {
  const { run, items } = buildParaphraseRows(artifact, options);
  return `WITH inserted_run AS (
  ${runInsertSql(run)}
)
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
) VALUES
${items.map(itemRowSql).join(",\n")}
ON CONFLICT DO NOTHING;`;
}

function main() {
  const artifactPath = process.argv[2];
  if (!artifactPath) {
    console.error("Usage: node scripts/content-paraphrase-sync.mjs <artifact.json>");
    process.exit(1);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  console.log(buildParaphraseSql(artifact));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
