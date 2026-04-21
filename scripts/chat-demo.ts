/**
 * 실제 채팅처럼 보여주는 turn-by-turn 데모.
 * shortcut + Schift subworkflow 를 풀 파이프라인으로 돌리고
 * 대화창 스타일로 출력.
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

function extractJsonFromText(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  const stripped = stripJsonFence(raw);
  // JSON 이 텍스트 중간 어딘가 있다면 첫 번째 { ... } 블록 찾기
  const firstBrace = stripped.indexOf("{");
  if (firstBrace < 0) return null;
  // matching brace
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = firstBrace; i < stripped.length; i++) {
    const ch = stripped[i];
    if (inStr) {
      if (esc) {
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(stripped.slice(firstBrace, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function renderUser(text: string) {
  const width = Math.min(50, text.length + 4);
  console.log();
  console.log(
    " ".repeat(Math.max(0, 60 - width)) +
      MAGENTA +
      "┌" +
      "─".repeat(width - 2) +
      "┐" +
      RESET,
  );
  console.log(
    " ".repeat(Math.max(0, 60 - width)) +
      MAGENTA +
      "│ " +
      RESET +
      text +
      MAGENTA +
      " │" +
      RESET,
  );
  console.log(
    " ".repeat(Math.max(0, 60 - width)) +
      MAGENTA +
      "└" +
      "─".repeat(width - 2) +
      "┘" +
      RESET,
  );
}

function renderBot(
  text: string,
  meta: {
    source: string;
    elapsedMs: number;
    scenario: string | null;
    stage: string | number | null;
    deepLinks?: Array<{ title?: string; entityId?: string }>;
    quickReplies?: Array<{ label: string }>;
  },
) {
  console.log();
  console.log(
    `${CYAN}🤖 아가야${RESET} ${DIM}[${meta.source} ${meta.elapsedMs}ms · stage=${meta.stage} · scenario=${meta.scenario ?? "?"}]${RESET}`,
  );
  for (const line of text.split(/\n/)) {
    console.log(`   ${line}`);
  }
  if (meta.deepLinks?.length) {
    for (const d of meta.deepLinks) {
      console.log(
        `   ${YELLOW}📎 ${d.title ?? "(카드)"} ${DIM}entity=${d.entityId ?? "-"}${RESET}`,
      );
    }
  }
  if (meta.quickReplies?.length) {
    console.log(
      `   ${GREEN}┌${meta.quickReplies.map((q) => "─".repeat(q.label.length + 2) + "┐").join(" ")}${RESET}`,
    );
    console.log(
      `   ${GREEN}│${meta.quickReplies.map((q) => ` ${q.label} │`).join(" ")}${RESET}`,
    );
    console.log(
      `   ${GREEN}└${meta.quickReplies.map((q) => "─".repeat(q.label.length + 2) + "┘").join(" ")}${RESET}`,
    );
  }
}

async function runTurn(
  turnNo: number,
  userText: string,
  state: {
    memory: Memory;
    progress: QuestionProgress;
    selectedQuestionId: string | null;
  },
  opts: { silent?: boolean } = {},
) {
  if (!opts.silent && userText) renderUser(userText);
  else if (!opts.silent) {
    console.log();
    console.log(DIM + "(앱 열기 — 첫 진입)" + RESET);
  }

  const t0 = performance.now();
  const selectedMood =
    moodPool.find((m) => m.message === userText)?.message ?? null;

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
    const text = (shortcut.assistantMessage.parts[0] as any)?.text ?? "";
    const qr = (
      shortcut.assistantMessage.parts.find(
        (p: any) => p.type === "quickReplies",
      ) as any
    )?.choices;
    renderBot(text, {
      source: "shortcut",
      elapsedMs,
      scenario: (shortcut.workflowMemoryPayload.scenario as string) ?? null,
      stage:
        (shortcut.workflowMemoryPayload.nextSessionMemory as any)?.stage ??
        null,
      quickReplies: qr,
    });
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
    console.log(YELLOW + "  (no workflow mapped)" + RESET);
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

  const rawAnswer =
    run.outputs?.answer ??
    run.outputs?.result?.answer ??
    run.outputs?.text ??
    "";
  const parsed = extractJsonFromText(rawAnswer);

  // 답변 본문: parsed.answer 우선, 없으면 raw 첫 문단
  let answerText = parsed?.answer as string | undefined;
  if (!answerText) {
    const firstJsonIdx = rawAnswer.indexOf("{");
    answerText =
      firstJsonIdx > 0 ? rawAnswer.slice(0, firstJsonIdx).trim() : rawAnswer;
  }

  renderBot(answerText ?? "(빈 응답)", {
    source: `schift:${selection.key}`,
    elapsedMs,
    scenario: (parsed?.scenario as string) ?? null,
    stage: (parsed?.nextSessionMemory as any)?.stage ?? state.memory.stage,
    deepLinks: parsed?.deepLinks as any,
    quickReplies: parsed?.quickReplies as any,
  });

  const next = parsed?.nextSessionMemory as any;
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
  console.log(BOLD + "━".repeat(72) + RESET);
  console.log(
    BOLD +
      "  💬 아가야 풀 파이프라인 데모 (임신 27주차, 하루 질문 3개)" +
      RESET,
  );
  console.log(BOLD + "━".repeat(72) + RESET);

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

  await runTurn(1, "", state);
  await runTurn(2, "오늘 기분이 좋아요.", state);
  await runTurn(3, "네, 오늘 주차 정보 볼래요.", state);
  await runTurn(4, "오늘의 질문으로 이어갈래요.", state);
  state.selectedQuestionId = "q-27-1";
  state.progress.currentAttachmentQuestionId = "q-27-1";
  await runTurn(
    5,
    "오늘 아기에게 가장 먼저 들려주고 싶은 말은 무엇인가요?",
    state,
  );
  state.selectedQuestionId = null;
  await runTurn(
    6,
    "엄마는 지금 네가 너무 소중해. 늘 건강하게 자라줬으면 해.",
    state,
  );
  await runTurn(7, "고마워요", state);
  state.selectedQuestionId = "q-27-2";
  state.progress.currentAttachmentQuestionId = "q-27-2";
  await runTurn(
    8,
    "요즘 아기가 어떤 순간에 엄마 마음을 느낄 것 같나요?",
    state,
  );
  state.selectedQuestionId = null;
  await runTurn(
    9,
    "태동이 느껴질 때마다 아이가 엄마 곁에 있구나 싶어요.",
    state,
  );
  await runTurn(10, "고마워요", state);
  state.selectedQuestionId = "q-27-3";
  state.progress.currentAttachmentQuestionId = "q-27-3";
  await runTurn(11, "오늘 하루 중 아기를 떠올린 순간이 있었나요?", state);
  state.selectedQuestionId = null;
  await runTurn(12, "아침에 아기 옷을 정리하다 문득 얼굴이 떠올랐어요.", state);
  await runTurn(13, "고마워요", state);
  await runTurn(14, "자유롭게 대화하고 싶어요.", state);
  await runTurn(15, "아기 이름 짓기 고민 중이에요.", state);
  await runTurn(16, "오늘은 여기까지 할게요.", state);

  console.log();
  console.log(BOLD + "━".repeat(72) + RESET);
  console.log(BOLD + "  ✓ 대화 종료" + RESET);
  console.log(BOLD + "━".repeat(72) + RESET);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
