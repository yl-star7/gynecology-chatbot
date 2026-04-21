/**
 * Schift workflow run 직접 호출 → 블록별 duration_ms 출력.
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

const WORKFLOW_ID =
  process.env.WORKFLOW_ID ?? "f04f0498ba914399a61251a1cab6876c";

const schift = new Schift({
  apiKey: process.env.SCHIFT_API_KEY!,
  baseUrl: process.env.SCHIFT_API_URL ?? undefined,
});

type BlockState = {
  status: string;
  duration_ms?: number;
  title?: string;
  type?: string;
  error?: unknown;
};

async function runOnce(
  label: string,
  query: string,
  inputs: Record<string, unknown>,
) {
  const t0 = performance.now();
  const run = (await schift.workflows.run(WORKFLOW_ID, {
    query,
    ...inputs,
  })) as {
    status: string;
    block_states?: Record<string, BlockState>;
    created_at?: string;
    started_at?: string;
    finished_at?: string;
    outputs?: Record<string, unknown>;
  };
  const httpMs = Math.round(performance.now() - t0);

  console.log(`\n=== ${label} | total ${httpMs}ms | status=${run.status} ===`);
  const bs = run.block_states ?? {};
  const rows = Object.entries(bs)
    .map(([id, s]) => ({ id, ...s, duration_ms: s.duration_ms ?? 0 }))
    .sort((a, b) => b.duration_ms - a.duration_ms);

  let sum = 0;
  for (const r of rows) {
    sum += r.duration_ms;
    console.log(
      `  ${String(r.duration_ms).padStart(6)}ms  ${r.status.padEnd(10)}  ${r.title ?? r.id}${r.type ? ` [${r.type}]` : ""}`,
    );
  }
  console.log(`  sum(block duration_ms) = ${sum}ms`);
  if (run.created_at || run.started_at || run.finished_at) {
    const start = run.started_at ? new Date(run.started_at).getTime() : null;
    const end = run.finished_at ? new Date(run.finished_at).getTime() : null;
    if (start && end) {
      console.log(`  Schift wall clock (started→finished) = ${end - start}ms`);
    }
    console.log(
      `  created_at=${run.created_at} started_at=${run.started_at} finished_at=${run.finished_at}`,
    );
  }
  console.log(
    `  HTTP - sum = ${httpMs - sum}ms (SDK + network + Schift overhead)`,
  );
}

const cases = [
  {
    label: "stage=2 정보 의도",
    query: "임신 27주차에 손발 부종이 정상인가요?",
    inputs: {
      currentWeek: 27,
      workflowStage: 2,
      selectedMood: "calm",
      compactSummary: "현재 단계: 질문 선택 완료",
      lastScenario: "attachment_question",
      lastCharacterTone: "calm",
      lastEmotionTone: "calm",
      hasImages: false,
      retrievalQuery: "",
      results: "",
      promptItems: "",
      sessionId: "t",
      weekKnowledgeEntityId: "",
      tonePreference: "",
      personaHint: "",
      personaConfidence: "",
      selectedQuestionId: "q1",
    },
  },
  {
    label: "stage=0 mood",
    query: "오늘 기분이 좋아요.",
    inputs: {
      currentWeek: 27,
      workflowStage: 0,
      selectedMood: "joyful",
      compactSummary: "",
      lastScenario: "",
      lastCharacterTone: "",
      lastEmotionTone: "",
      hasImages: false,
      retrievalQuery: "",
      results: "",
      promptItems: "",
      sessionId: "t2",
      weekKnowledgeEntityId: "",
      tonePreference: "",
      personaHint: "",
      personaConfidence: "",
      selectedQuestionId: "",
    },
  },
];

async function main() {
  for (const c of cases) await runOnce(c.label, c.query, c.inputs);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
