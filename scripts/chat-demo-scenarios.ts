/**
 * 5개 독립 시나리오 end-to-end 데모.
 * 각 시나리오는 첫 진입부터 종결까지, 질문당 4~5턴 공감 대화 포함.
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
import { rewriteLetterReflectionQuickReplies } from "../packages/mobile-api/src/chat/letter-reflection-postprocess";
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
const moodPool = (JSON.parse(wf.prompts.static_mood_intake ?? "{}")
  .moodPrompts ?? []) as Array<{
  label: string;
  message: string;
  tone: CharacterTone;
}>;
const weekInfoOptInVariations = (JSON.parse(
  wf.prompts.static_week_info_opt_in ?? "{}",
).answerVariations ?? []) as string[];

const QUESTIONS = [
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
type State = {
  memory: Memory;
  progress: QuestionProgress;
  selectedQuestionId: string | null;
};

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}
function extractJson(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  const s = stripJsonFence(raw);
  const start = s.indexOf("{");
  if (start < 0) return null;
  let d = 0,
    inStr = false,
    esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") d++;
    else if (c === "}") {
      d--;
      if (d === 0) {
        try {
          return JSON.parse(s.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function renderUser(text: string) {
  console.log();
  const line = `│ ${text} │`;
  const bar = "─".repeat(line.length - 2);
  const pad = " ".repeat(Math.max(0, 70 - line.length));
  console.log(pad + `┌${bar}┐`);
  console.log(pad + line);
  console.log(pad + `└${bar}┘`);
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
    `🤖 아가야  [${meta.source} ${meta.elapsedMs}ms · stage=${meta.stage} · ${meta.scenario ?? "?"}]`,
  );
  for (const ln of text.split(/\n/)) console.log(`   ${ln}`);
  if (meta.deepLinks?.length) {
    for (const d of meta.deepLinks) {
      console.log(`   📎 ${d.title ?? "(카드)"}  entity=${d.entityId ?? "-"}`);
    }
  }
  if (meta.quickReplies?.length) {
    console.log(`   ${meta.quickReplies.map((q) => `[${q.label}]`).join(" ")}`);
  }
}

async function runTurn(userText: string, state: State) {
  if (userText) renderUser(userText);
  else console.log("\n(앱 열기)");

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
        stage: state.memory.stage as any,
        stageName: state.memory.stageName ?? undefined,
        compactSummary: state.memory.compactSummary,
        lastScenario: state.memory.lastScenario ?? undefined,
      },
      profileMemory: null,
      week: { baby_summary: null, mother_summary: null },
      dayContent: null,
      questions: QUESTIONS.map((q) => ({ id: q.id, question_text: q.text })),
      checklist: [],
      tonePreference: null,
    } as any,
    moodPool,
    weekInfoOptInVariations,
    todayQuestionCandidates: QUESTIONS,
    progress: state.progress,
    rngSeed: Math.floor(Math.random() * 20),
  });

  if (shortcut) {
    const ms = Math.round(performance.now() - t0);
    const text = (shortcut.assistantMessage.parts[0] as any)?.text ?? "";
    const qr = (
      shortcut.assistantMessage.parts.find(
        (p: any) => p.type === "quickReplies",
      ) as any
    )?.choices;
    renderBot(text, {
      source: "shortcut",
      elapsedMs: ms,
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

  const sel = selectStageWorkflow(
    {
      query: userText,
      workflowStage: state.memory.stage,
      currentAttachmentQuestionId: state.progress.currentAttachmentQuestionId,
      lastScenario: state.memory.lastScenario ?? null,
      compactSummary: state.memory.compactSummary,
    },
    mapping,
  );
  if (!sel) return;

  const run = (await schift.workflows.run(sel.workflowId, {
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
  const ms = Math.round(performance.now() - t0);
  const raw = run.outputs?.answer ?? run.outputs?.result?.answer ?? "";
  const parsed = extractJson(raw);
  let answer = (parsed?.answer as string) ?? "";
  if (!answer) {
    const cleaned = stripJsonFence(raw);
    const idx = cleaned.indexOf("{");
    answer = idx > 0 ? cleaned.slice(0, idx).trim() : cleaned;
    if (/^```(?:json)?$/i.test(answer.trim())) {
      answer = "";
    }
  }
  // letter_reflection 응답 후처리: 남은 질문 개수 반영
  if (sel.key === "letter_reflection" && parsed) {
    rewriteLetterReflectionQuickReplies(parsed as any, state.progress);
  }
  renderBot(answer || "(빈 응답)", {
    source: `schift:${sel.key}`,
    elapsedMs: ms,
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

function freshState(): State {
  return {
    memory: { stage: null, stageName: null, compactSummary: "" },
    progress: { answeredQuestionIds: [], currentAttachmentQuestionId: null },
    selectedQuestionId: null,
  };
}

async function runScenario(
  label: string,
  moodMessage: string,
  yPath: boolean,
  answers: Array<{ question: 0 | 1 | 2; letter: string; follows: string[] }>,
  ending: "exhausted_end" | "free_chat_end" = "free_chat_end",
) {
  console.log("\n");
  console.log("━".repeat(72));
  console.log(`  📖 시나리오: ${label}`);
  console.log("━".repeat(72));

  const state = freshState();
  await runTurn("", state);
  await runTurn(moodMessage, state);
  if (yPath) {
    await runTurn("네, 오늘 주차 정보 볼래요.", state);
    await runTurn("오늘의 질문으로 이어갈래요.", state);
  } else {
    await runTurn("아니요, 이따가 확인할래요.", state);
  }

  for (const a of answers) {
    const q = QUESTIONS[a.question];
    state.selectedQuestionId = q.id;
    state.progress.currentAttachmentQuestionId = q.id;
    await runTurn(q.text, state);
    state.selectedQuestionId = null;
    await runTurn(a.letter, state);
    for (const follow of a.follows) {
      await runTurn("하나 더 이야기하고 싶어요.", state);
      await runTurn(follow, state);
    }
    await runTurn("다음 질문으로 이어갈래요.", state);
  }

  if (ending === "free_chat_end") {
    await runTurn("자유롭게 대화하고 싶어요.", state);
    await runTurn("아기 태교로 뭐가 좋을까요?", state);
    await runTurn("오늘은 여기까지 할게요.", state);
  } else {
    await runTurn("여기까지 할래요.", state);
  }
}

async function main() {
  // 시나리오 1: 긍정 엄마, 전체 3질문 + 질문당 5턴 (letter + 2 follows) + 자유대화
  await runScenario(
    "#1 긍정 엄마 (기분 좋음, N path, 질문 3개 모두 깊게 답변, 자유대화 후 종료)",
    "오늘 기분이 좋아요.",
    false,
    [
      {
        question: 0,
        letter: "엄마는 지금 네가 너무 소중해. 늘 건강하게 자라줬으면 해.",
        follows: [
          "우리 아이가 씩씩하게 자라면 좋겠어요. 나중에 엄마 손 꼭 잡고 놀자.",
          "혹시 내가 부족한 엄마가 될까 걱정이 들기도 해요.",
        ],
      },
      {
        question: 1,
        letter: "태동이 느껴질 때마다 아이가 엄마 곁에 있구나 싶어요.",
        follows: [
          "특히 밤에 조용할 때 아이 움직임이 선명해서 더 애틋해져요.",
          "아이도 제 목소리를 알아듣는 것 같아요.",
        ],
      },
      {
        question: 2,
        letter: "아침에 아기 옷을 정리하다 문득 얼굴이 떠올랐어요.",
        follows: [
          "그 순간 눈물이 살짝 났어요. 아이를 만날 날이 기다려져요.",
          "옷장을 정리할 때마다 설렘이 더 커지는 것 같아요.",
        ],
      },
    ],
    "free_chat_end",
  );

  // 시나리오 2: 불안 엄마, Y path, 질문 2개만 답하고 종료
  await runScenario(
    "#2 불안 엄마 (걱정돼요, Y path, 질문 2개 답 후 자유대화 없이 종료)",
    "오늘은 조금 걱정돼요.",
    true,
    [
      {
        question: 0,
        letter: "네가 건강하게 태어나주면 그걸로 충분해. 엄마가 많이 떨려.",
        follows: [
          "검사 결과 기다릴 때마다 심장이 쿵쾅거려요.",
          "혹시 내가 뭘 잘못하고 있는 건 아닐까 싶어져요.",
        ],
      },
      {
        question: 1,
        letter: "내가 편안할 때 아이도 편안해한다고 느껴요.",
        follows: ["그래서 요즘 숨을 천천히 쉬려고 노력해요."],
      },
    ],
    "exhausted_end",
  );

  // 시나리오 3: 피곤 엄마, N path, 각 질문 짧게만 답하고 빠르게 넘어감
  await runScenario(
    "#3 피곤 엄마 (피곤해요, N path, 각 질문 follows 없이 빠르게)",
    "오늘은 몸이 많이 피곤해요.",
    false,
    [
      { question: 0, letter: "사랑한다고 말해주고 싶어.", follows: [] },
      { question: 1, letter: "태동 느낄 때요.", follows: [] },
      { question: 2, letter: "잠들기 전에요.", follows: [] },
    ],
    "exhausted_end",
  );

  // 시나리오 4: 설레는 엄마, Y path, 질문 1개만 깊게 + 자유대화
  await runScenario(
    "#4 설레는 엄마 (설레요, Y path, 질문 1개만 4follow 깊게)",
    "아기를 생각하면 설레요.",
    true,
    [
      {
        question: 0,
        letter: "곧 만날 아기에게 엄마가 얼마나 기다렸는지 꼭 말해주고 싶어.",
        follows: [
          "너와 함께 걸을 공원도 상상해봤어.",
          "아이 이름도 거의 정한 것 같아요.",
          "아빠랑 같이 그림책을 골라보기도 했어요.",
          "빨리 그 순간이 왔으면 좋겠어요.",
        ],
      },
    ],
    "free_chat_end",
  );

  // 시나리오 5: 차분 엄마, N path, 질문 2개 중간 길이
  await runScenario(
    "#5 차분 엄마 (차분해요, N path, 질문 2개 각각 2follow)",
    "차분하게 이야기하고 싶어요.",
    false,
    [
      {
        question: 0,
        letter: "엄마는 너를 있는 그대로 사랑할 거야.",
        follows: [
          "강하게 키우려고 애쓰기보다 너의 속도를 따라가고 싶어.",
          "어떤 모습이든 네가 행복하면 좋겠어.",
        ],
      },
      {
        question: 2,
        letter: "산책할 때 아이와 함께 걷는 느낌이 들어 좋았어요.",
        follows: [
          "바람 냄새가 유난히 좋았던 오후였어요.",
          "아이가 저를 닮지 않았으면 하는 단점도 떠올랐어요.",
        ],
      },
    ],
    "free_chat_end",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
