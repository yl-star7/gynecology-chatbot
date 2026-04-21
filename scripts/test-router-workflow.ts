/**
 * Router workflow 호출 smoke test — 각 stage 별로 분기 확인.
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";

const WORKFLOW_ID =
  process.env.SCHIFT_WF_ROUTER ?? "dc7ec6bb55e24924a6566114e769cd89";

const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

type Case = {
  label: string;
  inputs: Record<string, unknown>;
  expectRoute: "baby_info" | "letter" | "free_chat" | "fallback";
};

const cases: Case[] = [
  {
    label: "stage=0 Y path → baby_info",
    inputs: {
      query: "네, 오늘 주차 정보 볼래요.",
      workflowStage: 0,
      currentWeek: 27,
      weekKnowledgeEntityId: "entity-27",
    },
    expectRoute: "baby_info",
  },
  {
    label: "stage=2 + currentAttachmentQuestionId → letter",
    inputs: {
      query: "엄마는 지금 네가 너무 소중해.",
      workflowStage: 2,
      currentAttachmentQuestionId: "q-27-1",
      compactSummary: "현재 단계: 질문 답변 중",
      answeredCount: 0,
      compressedLog: "",
    },
    expectRoute: "letter",
  },
  {
    label: "stage=free_chat → free_chat",
    inputs: {
      query: "아기 이름 짓기 고민 중이에요.",
      workflowStage: "free_chat",
      compressedLog: "",
    },
    expectRoute: "free_chat",
  },
  {
    label: "fallback (범위 외)",
    inputs: {
      query: "오늘 날씨 어때요?",
      workflowStage: 0,
      currentWeek: 27,
    },
    expectRoute: "fallback",
  },
];

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

async function runOne(c: Case) {
  const t0 = performance.now();
  const run = (await schift.workflows.run(WORKFLOW_ID, c.inputs)) as any;
  const elapsedMs = Math.round(performance.now() - t0);
  const outputs = run.outputs ?? {};
  const rawAnswer = outputs.answer ?? outputs.result?.answer ?? "";
  const parsed = (() => {
    try {
      return JSON.parse(stripJsonFence(rawAnswer));
    } catch {
      return null;
    }
  })();
  const scenario = parsed?.scenario ?? null;
  const routedTo = outputs._subworkflow_id ?? "?";
  console.log(
    `\n[${elapsedMs}ms] ${c.label}\n  scenario=${scenario}  routed→${routedTo}`,
  );
  console.log(`  answer: ${(parsed?.answer ?? rawAnswer).slice(0, 160)}`);
  if (parsed?.deepLinks?.length) {
    console.log(
      `  deepLinks: ${parsed.deepLinks.map((d: any) => d.title).join(", ")}`,
    );
  }
  if (parsed?.quickReplies?.length) {
    console.log(
      `  qr: ${parsed.quickReplies.map((q: any) => q.label).join(" / ")}`,
    );
  }
}

async function main() {
  console.log(`router workflow: ${WORKFLOW_ID}`);
  for (const c of cases) await runOne(c);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
