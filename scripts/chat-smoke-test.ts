/**
 * Schift workflow run smoke test — retriever 포함 새 그래프 기준
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

const WORKFLOW_ID =
  process.env.WORKFLOW_ID ?? "f04f0498ba914399a61251a1cab6876c";

const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

type Case = {
  label: string;
  query: string;
  inputs: Record<string, unknown>;
  expectScenarioIn?: string[];
};

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

async function runOne(c: Case) {
  const t0 = performance.now();
  const run = (await schift.workflows.run(WORKFLOW_ID, {
    query: c.query,
    ...c.inputs,
  })) as {
    status: string;
    block_states?: Record<
      string,
      { status: string; duration_ms?: number; title?: string; type?: string }
    >;
    outputs?: { result?: { answer?: string }; answer?: string };
    started_at?: string;
    finished_at?: string;
  };
  const elapsedMs = Math.round(performance.now() - t0);

  const rawAnswer = run.outputs?.result?.answer ?? run.outputs?.answer ?? "";
  const parsed = (() => {
    try {
      return JSON.parse(stripJsonFence(rawAnswer));
    } catch {
      return null;
    }
  })();

  const scenario = parsed?.scenario ?? null;
  const pass = c.expectScenarioIn
    ? scenario !== null && c.expectScenarioIn.includes(scenario)
    : true;
  const flag = pass ? "[PASS]" : "[FAIL]";

  console.log(
    `${flag} ${String(elapsedMs).padStart(6)}ms  ${(scenario ?? "?").padEnd(20)}  ${c.label}`,
  );
  if (parsed?.answer) {
    console.log(`         ans: ${parsed.answer.slice(0, 120)}`);
  } else if (rawAnswer) {
    console.log(`         raw: ${rawAnswer.slice(0, 120)}`);
  }

  const bs = run.block_states ?? {};
  const byType = Object.values(bs)
    .map((s) => ({ type: s.type ?? "?", d: s.duration_ms ?? 0 }))
    .filter((r) => r.d > 0)
    .sort((a, b) => b.d - a.d);
  if (byType.length > 0) {
    const parts = byType.map((r) => `${r.type}=${r.d}ms`).join(" ");
    console.log(`         blocks: ${parts}`);
  }
  if (run.started_at && run.finished_at) {
    const wall =
      new Date(run.finished_at).getTime() - new Date(run.started_at).getTime();
    console.log(
      `         schift wall=${wall}ms, sdk+network=${elapsedMs - wall}ms`,
    );
  }
  return { elapsedMs, pass };
}

const cases: Case[] = [
  {
    label: "stage=0 mood (positive)",
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
      sessionId: "t0",
      weekKnowledgeEntityId: "",
      tonePreference: "",
      personaHint: "",
      personaConfidence: "",
      selectedQuestionId: "",
    },
    expectScenarioIn: ["baby_info_offer", "emotion_checkin", "general"],
  },
  {
    label: "stage=2 정보 (부종)",
    query: "임신 27주차에 손발 부종이 정상 범위 수치가 어떻게 되나요?",
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
      sessionId: "t1",
      weekKnowledgeEntityId: "",
      tonePreference: "",
      personaHint: "",
      personaConfidence: "",
      selectedQuestionId: "q1",
    },
    expectScenarioIn: [
      "letter_reflection",
      "daily_followup",
      "empathy_chat",
      "week_info",
      "baby_info",
      "mother_info",
      "symptom_counsel",
      "general",
    ],
  },
  {
    label: "stage=2 편지형",
    query: "아기에게 편지를 썼어요. 엄마는 지금 네가 너무 소중해.",
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
      sessionId: "t2",
      weekKnowledgeEntityId: "",
      tonePreference: "",
      personaHint: "",
      personaConfidence: "",
      selectedQuestionId: "q1",
    },
    expectScenarioIn: [
      "letter_reflection",
      "daily_followup",
      "empathy_chat",
      "general",
    ],
  },
];

async function main() {
  console.log(`workflow: ${WORKFLOW_ID}\n`);
  const results: Array<{ elapsedMs: number; pass: boolean }> = [];
  for (const c of cases) {
    results.push(await runOne(c));
  }
  const pass = results.filter((r) => r.pass).length;
  const avg = Math.round(
    results.reduce((a, r) => a + r.elapsedMs, 0) / results.length,
  );
  console.log(`\nsummary: ${pass}/${results.length} pass, avg ${avg}ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
