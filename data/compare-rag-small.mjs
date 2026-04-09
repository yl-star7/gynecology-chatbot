import { Schift } from "@schift-io/sdk";
import { writeFile } from "node:fs/promises";

const API_KEY = process.env.SCHIFT_API_KEY;
if (!API_KEY) {
  throw new Error("SCHIFT_API_KEY is required");
}

const client = new Schift({ apiKey: API_KEY });

const MODE = process.env.MODE ?? "search";
const COLLECTION = process.env.SCHIFT_COLLECTION ?? "pregnancy-knowledge";
const SEARCH_TOP_K = Number(process.env.TOP_K ?? 5);
const CURRENT_WEEK = process.env.CURRENT_WEEK
  ? Number(process.env.CURRENT_WEEK)
  : 10;
const WORKFLOW_NAME = process.env.WORKFLOW_NAME ?? "모성간호 상담 응답";
const OUT = new URL(`./rag-small-results-${MODE}.json`, import.meta.url);

const QUERIES = [
  "입덧이 너무 심해요. 언제 병원에 가야 하나요?",
  "임신 초기 출혈이 조금 있는데 바로 병원에 가야 하나요?",
  "임신 중 변비가 심한데 어떻게 완화하면 좋을까요?",
  "다리가 자주 쥐나요. 왜 그런가요?",
  "임신 중 두통이 있으면 위험한 경우가 있나요?",
  "가슴앓이가 심한데 먹는 습관을 어떻게 바꾸면 좋을까요?",
  "요통이 심한데 자세나 생활에서 무엇을 조심해야 하나요?",
  "발목이 붓는데 정상 범위인지 궁금해요.",
  "빈뇨가 심한데 요로감염과 어떻게 구분하나요?",
  "임신 중 오심과 구토 완화 방법을 알려주세요.",
];

function normalizeSearchResponse(response) {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.results)) return response.results;
  return [];
}

function slimSearchResult(result) {
  const metadata = result.metadata ?? {};
  const text =
    typeof metadata.text === "string"
      ? metadata.text
      : typeof metadata.content === "string"
        ? metadata.content
        : "";

  return {
    id: result.id,
    score: result.score,
    file_name:
      typeof metadata.file_name === "string"
        ? metadata.file_name
        : typeof metadata.filename === "string"
          ? metadata.filename
          : null,
    doc_id:
      typeof metadata.doc_id === "string"
        ? metadata.doc_id
        : typeof metadata.document_id === "string"
          ? metadata.document_id
          : null,
    preview: text.replace(/\s+/g, " ").slice(0, 220),
  };
}

function readWorkflowOutputs(run) {
  if (run?.outputs && typeof run.outputs === "object") {
    return run.outputs;
  }

  if (Array.isArray(run?.block_states)) {
    for (const state of run.block_states) {
      const output = state?.outputs ?? state?.output;
      if (output && typeof output === "object") {
        return output;
      }
    }
  }

  return null;
}

function summarizeWorkflowResult(run) {
  const outputs = readWorkflowOutputs(run) ?? {};
  const answerCandidates = [
    outputs.answer,
    outputs.reply,
    outputs.result,
    outputs.output,
    outputs.text,
    outputs.response,
    outputs.content,
    outputs.message,
  ];

  const answer = answerCandidates.find(
    (value) => typeof value === "string" && value.trim(),
  );

  const references = Array.isArray(outputs.references)
    ? outputs.references.slice(0, 5)
    : [];

  return {
    status: run?.status ?? null,
    error: run?.error ?? null,
    answer: typeof answer === "string" ? answer : null,
    references,
  };
}

async function resolveWorkflowId() {
  const workflowId = process.env.WORKFLOW_ID?.trim();
  if (workflowId) return workflowId;

  const workflows = await client.workflows.list();
  const matched = workflows.find((workflow) => workflow.name === WORKFLOW_NAME);
  if (!matched) {
    throw new Error(`Workflow not found: ${WORKFLOW_NAME}`);
  }
  return matched.id;
}

async function runSearchMode() {
  const rows = [];

  for (let i = 0; i < QUERIES.length; i++) {
    const query = QUERIES[i];
    console.log(`\n[search ${i + 1}/${QUERIES.length}] ${query}`);

    const startedAt = Date.now();
    const response = await client.search({
      query,
      collection: COLLECTION,
      topK: SEARCH_TOP_K,
    });
    const latencyMs = Date.now() - startedAt;
    const results = normalizeSearchResponse(response);

    const row = {
      mode: "search",
      query,
      collection: COLLECTION,
      topK: SEARCH_TOP_K,
      latencyMs,
      hitCount: results.length,
      results: results.map(slimSearchResult),
    };

    rows.push(row);
    console.log(`  hits=${row.hitCount}, latency=${latencyMs}ms`);
    for (const [idx, item] of row.results.slice(0, 3).entries()) {
      console.log(
        `  ${idx + 1}. score=${item.score.toFixed(3)} file=${item.file_name ?? "-"}`,
      );
    }
  }

  return rows;
}

async function runWorkflowMode() {
  const workflowId = await resolveWorkflowId();
  const rows = [];

  for (let i = 0; i < QUERIES.length; i++) {
    const query = QUERIES[i];
    console.log(`\n[workflow ${i + 1}/${QUERIES.length}] ${query}`);

    const startedAt = Date.now();
    const run = await client.workflows.run(workflowId, {
      query,
      currentWeek: CURRENT_WEEK,
      sessionId: `compare-${i + 1}`,
      hasImages: false,
    });
    const latencyMs = Date.now() - startedAt;
    const summary = summarizeWorkflowResult(run);

    const row = {
      mode: "workflow",
      workflowId,
      workflowName: WORKFLOW_NAME,
      query,
      currentWeek: CURRENT_WEEK,
      latencyMs,
      ...summary,
    };

    rows.push(row);
    console.log(`  status=${row.status}, latency=${latencyMs}ms`);
    if (row.answer) {
      console.log(`  answer=${row.answer.replace(/\s+/g, " ").slice(0, 160)}`);
    }
  }

  return rows;
}

async function main() {
  const rows = MODE === "workflow" ? await runWorkflowMode() : await runSearchMode();
  await writeFile(OUT, JSON.stringify(rows, null, 2), "utf8");
  console.log(`\n저장 완료: ${OUT.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
