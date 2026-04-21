/**
 * 풀 파이프라인 통합 테스트:
 *   - stage-shortcut (static 턴)
 *   - stage-workflow-selector (Schift 호출 시 workflow ID 선택)
 *   - 실제 Schift subworkflow 호출 (baby_info / letter_reflection / free_chat / general)
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Schift } from "@schift-io/sdk";
import {
  maybeShortCircuitStaticTurn,
  type QuestionProgress,
} from "../packages/mobile-api/src/chat/stage-shortcut";
import {
  selectStageWorkflow,
  type StageWorkflowMapping,
} from "../packages/mobile-api/src/chat/stage-workflow-selector";
import { loadMaternalNursingWorkflow } from "../packages/mobile-api/src/workflows/load-workflow-yaml";
import type { CharacterTone } from "../packages/mobile-api/src/chat/workflow-payload";

const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

const mapping: StageWorkflowMapping = {
  baby_info: process.env.SCHIFT_WF_BABY_INFO ?? "",
  letter_reflection: process.env.SCHIFT_WF_LETTER_REFLECTION ?? "",
  free_chat: process.env.SCHIFT_WF_FREE_CHAT ?? "",
  general: process.env.SCHIFT_WF_GENERAL ?? "",
};

const wf = loadMaternalNursingWorkflow();
const moodIntake = JSON.parse(wf.prompts.static_mood_intake ?? "{}");
const optIn = JSON.parse(wf.prompts.static_week_info_opt_in ?? "{}");
const moodPool = (moodIntake.moodPrompts ?? []) as Array<{
  label: string;
  message: string;
  tone: CharacterTone;
}>;
const weekInfoOptInVariations = (optIn.answerVariations ?? []) as string[];

const todayQuestionCandidates = [
  {
    id: "q-27-1",
    text: "오늘 아기에게 가장 먼저 들려주고 싶은 말은 무엇인가요?",
  },
  { id: "q-27-2", text: "요즘 아기가 어떤 순간에 엄마 마음을 느낄 것 같나요?" },
  { id: "q-27-3", text: "오늘 하루 중 아기를 떠올린 순간이 있었나요?" },
];

type Memory = {
  stage: number | string | null;
  stageName: string | null;
  compactSummary: string;
  moodId?: string | null;
  moodLabel?: string | null;
  lastScenario?: string | null;
};

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

async function runTurn(
  turnNo: number,
  userText: string,
  state: {
    memory: Memory;
    progress: QuestionProgress;
    selectedQuestionId: string | null;
  },
) {
  const t0 = performance.now();
  const selectedMood =
    moodPool.find((m) => m.message === userText)?.message ?? null;

  // 1) stage-shortcut 우선
  const shortcut = maybeShortCircuitStaticTurn({
    userText,
    selectedMood,
    selectedQuestionId: state.selectedQuestionId,
    currentWeek: 27,
    promptContext: {
      sessionMemory: {
        stage: state.memory.stage as number | string | undefined,
        stageName: state.memory.stageName ?? undefined,
        compactSummary: state.memory.compactSummary,
        lastScenario: state.memory.lastScenario ?? undefined,
      },
      profileMemory: null,
      week: { baby_summary: null, mother_summary: null },
      dayContent: null,
      questions: todayQuestionCandidates.map((q) => ({
        id: q.id,
        question_text: q.text,
      })),
      checklist: [],
      tonePreference: null,
    } as any,
    moodPool,
    weekInfoOptInVariations,
    todayQuestionCandidates,
    progress: state.progress,
    rngSeed: turnNo,
  });

  if (shortcut) {
    const elapsedMs = Math.round(performance.now() - t0);
    const text =
      (shortcut.assistantMessage.parts[0] as any)?.text?.slice(0, 120) ?? "";
    const qr = shortcut.assistantMessage.parts.find(
      (p: any) => p.type === "quickReplies",
    ) as any;
    console.log(
      `\n[Turn ${turnNo}] 🚀 shortcut ${elapsedMs}ms  scenario=${shortcut.workflowMemoryPayload.scenario}`,
    );
    console.log(`  user: ${userText}`);
    console.log(`  bot:  ${text}`);
    if (qr?.choices)
      console.log(`  qr:   ${qr.choices.map((c: any) => c.label).join(" / ")}`);
    const next = shortcut.workflowMemoryPayload.nextSessionMemory as any;
    state.memory = {
      stage: next?.stage ?? null,
      stageName: next?.stageName ?? null,
      compactSummary: next?.compactSummary ?? "",
      moodId: next?.moodId ?? state.memory.moodId ?? null,
      moodLabel: next?.moodLabel ?? state.memory.moodLabel ?? null,
      lastScenario: next?.lastScenario ?? null,
    };
    if (Array.isArray(next?.answeredQuestionIds))
      state.progress.answeredQuestionIds = next.answeredQuestionIds;
    if (next?.currentAttachmentQuestionId !== undefined)
      state.progress.currentAttachmentQuestionId =
        next.currentAttachmentQuestionId;
    return;
  }

  // 2) Schift subworkflow 선택
  const selection = selectStageWorkflow(
    {
      query: userText,
      workflowStage: state.memory.stage,
      currentAttachmentQuestionId: state.progress.currentAttachmentQuestionId,
      lastScenario: state.memory.lastScenario ?? null,
      compactSummary: state.memory.compactSummary,
    },
    mapping,
  );

  if (!selection) {
    console.log(`\n[Turn ${turnNo}] ❌ no workflow mapping`);
    return;
  }

  const run = (await schift.workflows.run(selection.workflowId, {
    query: userText,
    currentWeek: 27,
    workflowStage: state.memory.stage ?? 0,
    currentAttachmentQuestionId:
      state.progress.currentAttachmentQuestionId ?? "",
    compactSummary: state.memory.compactSummary,
    lastScenario: state.memory.lastScenario ?? "",
    compressedLog: "",
    answeredCount: state.progress.answeredQuestionIds.length,
    weekKnowledgeEntityId: "entity-27",
  })) as any;
  const elapsedMs = Math.round(performance.now() - t0);

  const rawAnswer = run.outputs?.answer ?? run.outputs?.result?.answer ?? "";
  const parsed = (() => {
    try {
      return JSON.parse(stripJsonFence(rawAnswer));
    } catch {
      return null;
    }
  })();

  console.log(
    `\n[Turn ${turnNo}] 🧠 schift[${selection.key}] ${elapsedMs}ms  (reason: ${selection.reason})`,
  );
  console.log(`  user: ${userText}`);
  console.log(
    `  bot:  [${parsed?.scenario ?? "?"}] ${(parsed?.answer ?? rawAnswer).slice(0, 160)}`,
  );
  if (parsed?.deepLinks?.length) {
    console.log(
      `  deepLinks: ${parsed.deepLinks.map((d: any) => `${d.target}/${d.title}`).join(", ")}`,
    );
  }
  if (parsed?.quickReplies?.length) {
    console.log(
      `  qr:   ${parsed.quickReplies.map((q: any) => q.label).join(" / ")}`,
    );
  }
  const next = parsed?.nextSessionMemory;
  if (next) {
    state.memory = {
      stage: next.stage ?? state.memory.stage,
      stageName: next.stageName ?? state.memory.stageName,
      compactSummary: next.compactSummary ?? state.memory.compactSummary,
      moodId: next.moodId ?? state.memory.moodId ?? null,
      moodLabel: next.moodLabel ?? state.memory.moodLabel ?? null,
      lastScenario: next.lastScenario ?? state.memory.lastScenario ?? null,
    };
  }
}

async function main() {
  console.log("=== 풀 파이프라인 테스트 ===");
  console.log("mapping:", mapping);

  const state = {
    memory: {
      stage: null as number | string | null,
      stageName: null as string | null,
      compactSummary: "",
    },
    progress: {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: null,
    } as QuestionProgress,
    selectedQuestionId: null as string | null,
  };

  // === 시나리오: 전체 플로우 ===
  await runTurn(1, "", state); // mood prompt
  await runTurn(2, "오늘 기분이 좋아요.", state); // mood → opt-in
  await runTurn(3, "네, 오늘 주차 정보 볼래요.", state); // Y path → baby_info subworkflow
  await runTurn(4, "오늘의 질문으로 이어갈래요.", state); // stage=1 → today_question shortcut
  state.selectedQuestionId = "q-27-1";
  state.progress.currentAttachmentQuestionId = "q-27-1";
  await runTurn(
    5,
    "오늘 아기에게 가장 먼저 들려주고 싶은 말은 무엇인가요?",
    state,
  ); // stage=1 → letter prompt shortcut
  state.selectedQuestionId = null;
  await runTurn(6, "엄마는 지금 네가 너무 소중해.", state); // stage=2 letter → letter_reflection subworkflow
  await runTurn(7, "고마워요", state); // closing → shortcut 재진입
  state.selectedQuestionId = "q-27-2";
  state.progress.currentAttachmentQuestionId = "q-27-2";
  await runTurn(
    8,
    "요즘 아기가 어떤 순간에 엄마 마음을 느낄 것 같나요?",
    state,
  );
  state.selectedQuestionId = null;
  await runTurn(9, "태동이 느껴질 때.", state);
  await runTurn(10, "고마워요", state);
  state.selectedQuestionId = "q-27-3";
  state.progress.currentAttachmentQuestionId = "q-27-3";
  await runTurn(11, "오늘 하루 중 아기를 떠올린 순간이 있었나요?", state);
  state.selectedQuestionId = null;
  await runTurn(12, "아침에 문득 떠올랐어요.", state);
  await runTurn(13, "고마워요", state); // 3/3 소진 → exhausted
  await runTurn(14, "자유롭게 대화하고 싶어요.", state); // → free_chat
  await runTurn(15, "아기 이름 짓기 고민 중이에요.", state); // free_chat subworkflow
  await runTurn(16, "오늘은 여기까지 할게요.", state); // ended
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
