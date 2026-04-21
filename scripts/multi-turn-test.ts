/**
 * 멀티턴 대화 시뮬레이터.
 * - 각 턴마다 shortcut(route.ts 로직 재현) → 필요 시 Schift RAG 호출
 * - session memory + progress 를 in-memory 로 다음 턴에 전달
 *
 * 실제 route.ts 와의 차이:
 *  - DB I/O (user_question_events / calendar_logs) 스킵
 *  - prompt context 는 간소화 (오늘의 질문 후보 hardcoded)
 *  - selectedQuestionId 는 사용자 입력이 quickReply id 형식일 때만 추출
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
import { loadMaternalNursingWorkflow } from "../packages/mobile-api/src/workflows/load-workflow-yaml";
import type { CharacterTone } from "../packages/mobile-api/src/chat/workflow-payload";

const WORKFLOW_ID =
  process.env.WORKFLOW_ID ?? "f04f0498ba914399a61251a1cab6876c";

const schift = new Schift({ apiKey: process.env.SCHIFT_API_KEY! });

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
  lastCharacterTone?: string | null;
  lastEmotionTone?: string | null;
};

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function formatQuickReplies(
  parts: Array<{
    type: string;
    choices?: Array<{ id: string; label: string }>;
  }>,
): string {
  const q = parts.find((p) => p.type === "quickReplies");
  if (!q || !q.choices) return "";
  return q.choices.map((c) => `[${c.id}] ${c.label}`).join(" / ");
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
        lastCharacterTone: state.memory.lastCharacterTone ?? undefined,
        lastEmotionTone: state.memory.lastEmotionTone ?? undefined,
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
    } as unknown as Parameters<
      typeof maybeShortCircuitStaticTurn
    >[0]["promptContext"],
    moodPool,
    weekInfoOptInVariations,
    todayQuestionCandidates,
    progress: state.progress,
    rngSeed: turnNo,
  });

  let source: string;
  let parts: Array<{
    type: string;
    text?: string;
    choices?: Array<{ id: string; label: string; message: string }>;
  }> = [];
  let scenario: string | null = null;
  let nextMemory: Memory = state.memory;
  let deepLinks: Array<{
    title?: string;
    target?: string;
    entityId?: string;
  }> = [];

  if (shortcut) {
    source = "shortcut";
    parts = shortcut.assistantMessage.parts as typeof parts;
    scenario = (shortcut.workflowMemoryPayload.scenario as string) ?? null;
    const next = shortcut.workflowMemoryPayload.nextSessionMemory as
      | Record<string, unknown>
      | undefined;
    nextMemory = {
      stage: (next?.stage as number | string | null) ?? null,
      stageName: (next?.stageName as string | null) ?? null,
      compactSummary: (next?.compactSummary as string) ?? "",
      moodId: (next?.moodId as string | null) ?? state.memory.moodId ?? null,
      moodLabel:
        (next?.moodLabel as string | null) ?? state.memory.moodLabel ?? null,
      lastScenario: (next?.lastScenario as string | null) ?? null,
      lastCharacterTone: (next?.lastCharacterTone as string | null) ?? null,
      lastEmotionTone: (next?.lastEmotionTone as string | null) ?? null,
    };
    // progress 자동 갱신: shortcut 이 반환한 answered/current 로 state 업데이트
    const nextAnswered = next?.answeredQuestionIds as string[] | undefined;
    const nextCurrent = next?.currentAttachmentQuestionId as
      | string
      | null
      | undefined;
    if (Array.isArray(nextAnswered)) {
      state.progress.answeredQuestionIds = nextAnswered;
    }
    if (nextCurrent !== undefined) {
      state.progress.currentAttachmentQuestionId = nextCurrent;
    }
  } else {
    source = "schift";
    const run = (await schift.workflows.run(WORKFLOW_ID, {
      query: userText,
      currentWeek: 27,
      workflowStage: state.memory.stage ?? 0,
      selectedMood: state.memory.moodLabel ?? "",
      compactSummary: state.memory.compactSummary,
      lastScenario: state.memory.lastScenario ?? "",
      lastCharacterTone: state.memory.lastCharacterTone ?? "",
      lastEmotionTone: state.memory.lastEmotionTone ?? "",
      hasImages: false,
      retrievalQuery: "",
      results: "",
      promptItems: "",
      sessionId: "simulator",
      weekKnowledgeEntityId: "",
      tonePreference: "",
      personaHint: "",
      personaConfidence: "",
      selectedQuestionId: state.selectedQuestionId ?? "",
    })) as any;
    const raw = run.outputs?.answer ?? run.outputs?.result?.answer ?? "";
    try {
      const j = JSON.parse(stripJsonFence(raw));
      scenario = (j.scenario as string) ?? null;
      const answerText = (j.answer as string) ?? raw;
      parts.push({ type: "text", text: answerText });
      if (Array.isArray(j.deepLinks)) {
        deepLinks = j.deepLinks;
      }
      const nextQr = j.quickReplies as
        | Array<{ label: string; message: string }>
        | undefined;
      if (Array.isArray(nextQr) && nextQr.length > 0) {
        parts.push({
          type: "quickReplies",
          choices: nextQr.map((c, i) => ({
            id: `qr-${i}`,
            label: c.label,
            message: c.message,
          })),
        });
      }
      const next = j.nextSessionMemory as Record<string, unknown> | undefined;
      if (next) {
        nextMemory = {
          stage: (next.stage as number | string | null) ?? state.memory.stage,
          stageName:
            (next.stageName as string | null) ?? state.memory.stageName,
          compactSummary:
            (next.compactSummary as string) ?? state.memory.compactSummary,
          moodId: (next.moodId as string | null) ?? state.memory.moodId ?? null,
          moodLabel:
            (next.moodLabel as string | null) ?? state.memory.moodLabel ?? null,
          lastScenario:
            (next.lastScenario as string | null) ?? scenario ?? null,
          lastCharacterTone: (next.lastCharacterTone as string | null) ?? null,
          lastEmotionTone: (next.lastEmotionTone as string | null) ?? null,
        };
      }
    } catch (e) {
      parts.push({ type: "text", text: raw.slice(0, 200) });
    }
    // 라우트와 같은 stage 보정: progress.currentAttachmentQuestionId 있고 LLM이 stage=0으로 리셋했으면 stage=2로 force
    if (
      state.progress.currentAttachmentQuestionId &&
      (nextMemory.stage === 0 || nextMemory.stage === "0")
    ) {
      nextMemory.stage = 2;
      nextMemory.stageName = "choice_conversation";
      if (!nextMemory.compactSummary.includes("질문")) {
        nextMemory.compactSummary = "현재 단계: 질문 답변 중";
      }
    }
  }

  const elapsedMs = Math.round(performance.now() - t0);
  const text =
    parts
      .flatMap((p) => (p.type === "text" && p.text ? [p.text] : []))
      .join("\n") || "(empty)";
  const quickLabels = formatQuickReplies(parts);

  console.log(`\n── Turn ${turnNo} [${source}, ${elapsedMs}ms] ──`);
  console.log(`  user: ${userText}`);
  console.log(
    `  bot  [${scenario ?? "?"}]: ${text.slice(0, 180)}${text.length > 180 ? "..." : ""}`,
  );
  if (quickLabels) console.log(`  qr: ${quickLabels}`);
  if (deepLinks.length > 0) {
    console.log(
      `  deepLinks: ${deepLinks
        .map(
          (d) =>
            `${d.target ?? "?"} "${d.title ?? "?"}" entity=${d.entityId ?? "-"}`,
        )
        .join("; ")}`,
    );
  }
  console.log(
    `  next: stage=${nextMemory.stage} name=${nextMemory.stageName ?? "-"} ` +
      `mood=${nextMemory.moodLabel ?? "-"} scenario=${nextMemory.lastScenario ?? "-"}`,
  );
  console.log(
    `  progress: answered=[${state.progress.answeredQuestionIds.join(",")}] current=${state.progress.currentAttachmentQuestionId ?? "-"}`,
  );

  return { memory: nextMemory, source, scenario, deepLinks };
}

async function main() {
  let state: {
    memory: Memory;
    progress: QuestionProgress;
    selectedQuestionId: string | null;
  } = {
    memory: {
      stage: null,
      stageName: null,
      compactSummary: "",
    },
    progress: {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: null,
    },
    selectedQuestionId: null,
  };

  console.log(
    "======= 시나리오: 첫 진입 → mood → N path → 질문 1개 답변 → 종료 =======",
  );

  // Turn 1: 첫 진입
  let r = await runTurn(1, "", state);
  state.memory = r.memory;

  // Turn 2: mood 선택 ("오늘 기분이 좋아요.")
  state.selectedQuestionId = null;
  r = await runTurn(2, "오늘 기분이 좋아요.", state);
  state.memory = r.memory;

  // Turn 3: opt-in N (바로 오늘의 질문으로)
  r = await runTurn(3, "아니요, 이따가 확인할래요.", state);
  state.memory = r.memory;

  // Turn 4: 질문 선택 (quickReply qr tap → selectedQuestionId 주어짐)
  state.selectedQuestionId = "q-27-1";
  state.progress = {
    ...state.progress,
    currentAttachmentQuestionId: "q-27-1",
  };
  r = await runTurn(
    4,
    "오늘 아기에게 가장 먼저 들려주고 싶은 말은 무엇인가요?",
    state,
  );
  state.memory = r.memory;

  // Turn 5: 편지 작성
  state.selectedQuestionId = null;
  r = await runTurn(
    5,
    "엄마는 지금 네가 너무 소중해. 늘 건강하게 자라주면 좋겠어.",
    state,
  );
  state.memory = r.memory;

  // Turn 6: closing → 남은 질문 있으면 stage=1 재진입
  //   shortcut 이 progress.answeredQuestionIds 를 자동 갱신함
  r = await runTurn(6, "고마워요", state);
  state.memory = r.memory;

  // Turn 7: 질문 2 선택
  state.selectedQuestionId = "q-27-2";
  state.progress.currentAttachmentQuestionId = "q-27-2";
  r = await runTurn(
    7,
    "요즘 아기가 어떤 순간에 엄마 마음을 느낄 것 같나요?",
    state,
  );
  state.memory = r.memory;

  // Turn 8: 2차 편지
  state.selectedQuestionId = null;
  r = await runTurn(
    8,
    "태동이 느껴질 때마다 우리 아이가 내 곁에 있구나 싶어요.",
    state,
  );
  state.memory = r.memory;

  // Turn 9: 또 closing → 남은 질문 1개(q-27-3) 또는 소진
  r = await runTurn(9, "고마워요", state);
  state.memory = r.memory;

  // Turn 10: 마지막 질문 선택 (q-27-3)
  state.selectedQuestionId = "q-27-3";
  state.progress.currentAttachmentQuestionId = "q-27-3";
  r = await runTurn(10, "오늘 하루 중 아기를 떠올린 순간이 있었나요?", state);
  state.memory = r.memory;

  // Turn 11: 3번째 편지
  state.selectedQuestionId = null;
  r = await runTurn(
    11,
    "아침에 아기 옷을 정리하다가 문득 아이 얼굴이 떠올랐어요.",
    state,
  );
  state.memory = r.memory;

  // Turn 12: closing → 3/3 소진 → exhausted_choice (자유대화/종료)
  r = await runTurn(12, "고마워요", state);
  state.memory = r.memory;

  // Turn 13: 자유대화 선택 → stage=free_chat
  r = await runTurn(13, "자유롭게 대화하고 싶어요.", state);
  state.memory = r.memory;

  // Turn 14: 자유대화 (LLM 경로)
  r = await runTurn(14, "아기 이름 짓기 고민 중이에요.", state);
  state.memory = r.memory;

  // Turn 15: 자유대화 중 종료
  r = await runTurn(15, "오늘은 여기까지 할게요.", state);
  state.memory = r.memory;

  console.log(
    "\n\n======= 시나리오 2: stage=0 Y path (주차 정보 + deepLinks) =======",
  );
  state = {
    memory: { stage: null, stageName: null, compactSummary: "" },
    progress: { answeredQuestionIds: [], currentAttachmentQuestionId: null },
    selectedQuestionId: null,
  };
  // Turn 1: mood prompt
  r = await runTurn(1, "", state);
  state.memory = r.memory;
  // Turn 2: mood 선택
  r = await runTurn(2, "오늘 기분이 좋아요.", state);
  state.memory = r.memory;
  // Turn 3: Y path → Schift LLM (deepLinks 기대)
  r = await runTurn(3, "네, 오늘 주차 정보 볼래요.", state);
  state.memory = r.memory;
  if (r.deepLinks && r.deepLinks.length > 0) {
    console.log(`  ✓ deepLinks 포함됨 (${r.deepLinks.length}개)`);
  } else {
    console.log(`  ✗ deepLinks 누락 — LLM 프롬프트 규약 재점검 필요`);
  }

  console.log("\n======= 종료 =======");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
