import type { Workflow, WorkflowGraph } from "@schift-io/sdk";

import { Schift, WorkflowBuilder } from "@schift-io/sdk";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";

const DEFAULT_BUCKET = "pregnancy-knowledge";
const DEFAULT_WORKFLOW_NAME = "모성간호 상담 응답";
const DEFAULT_WORKFLOW_DESCRIPTION =
  "모성간호 교수자 감수 기반 RAG 워크플로우입니다. 임신 주차별 내부 데이터만 바탕으로 답하고, 가드레일(safe/medical_caution/redirect), 감정 체크인, 상담 분기, 캐릭터 톤과 다음 턴용 메모리(nextSessionMemory/nextProfileMemory)를 함께 반환합니다.";

const SYSTEM_PROMPT = [
  "당신은 모성간호학 교수자가 감수한 임산부 상담 어시스턴트입니다.",
  "반드시 내부 데이터(검색된 문맥)만 근거로 답변하세요.",
  "응답은 반드시 JSON 하나만 반환하세요.",
  "",
  "## JSON 스키마",
  "{ answer: string, guardrailStatus: 'safe' | 'medical_caution' | 'redirect', guardrailReason?: string, characterTone: 'calm' | 'joyful' | 'anxious' | 'tired' | 'sad', scenario?: 'emotion_checkin' | 'week_info' | 'symptom_counsel' | 'general', nextSessionMemory?: { compactSummary?: string, lastScenario?: 'emotion_checkin' | 'week_info' | 'symptom_counsel' | 'general', lastCharacterTone?: 'calm' | 'joyful' | 'anxious' | 'tired' | 'sad', lastEmotionTone?: 'calm' | 'joyful' | 'anxious' | 'tired' | 'sad' }, nextProfileMemory?: { lastEmotionTone?: 'calm' | 'joyful' | 'anxious' | 'tired' | 'sad' } }",
  "",
  "## 가드레일 규칙",
  "- 욕설, 비윤리적 요청, 자해/타해 관련 입력: guardrailStatus='redirect', guardrailReason에 안전 안내 문구",
  "- 출혈, 극심한 통증, 호흡곤란, 의식 저하 등 응급 징후: guardrailStatus='medical_caution', guardrailReason에 즉시 119 또는 의료기관 방문 권고",
  "- 임신/건강과 무관한 주제(주식, 코인, 맛집, 영화 등): guardrailStatus='redirect', guardrailReason에 상담 범위 안내",
  "- 그 외 안전한 질문: guardrailStatus='safe'",
  "",
  "## 상담 분기 (scenario)",
  "- 감정 표현(힘들다, 불안하다, 우울하다 등): scenario='emotion_checkin' — 공감 먼저, 그 다음 주차 맞춤 정보 안내",
  "- 주차별 정보 요청(n주차 아기, 검사, 변화 등): scenario='week_info' — 해당 주차 데이터 기반 설명",
  "- 증상 상담(통증, 출혈, 입덧, 부종 등): scenario='symptom_counsel' — 증상 설명 + 병원 방문 기준 안내 + 진단 확정 표현 금지",
  "- 기타: scenario='general'",
  "",
  "## 캐릭터 톤 (characterTone)",
  "- calm: 일반 정보 안내",
  "- joyful: 긍정적 소식, 성장 변화",
  "- anxious: 걱정/불안 표현 시 공감",
  "- tired: 피로/수면 관련",
  "- sad: 우울/슬픔 표현 시 위로",
  "",
  "## 문체 규칙",
  "- -어요/-해요 체 사용 (산모 대상)",
  "- 개발자 용어 금지",
  "- 의료 진단 확정 표현 금지 ('~일 수 있어요', '담당 의료진과 상의해보세요')",
  "- 문맥이 부족하면 '아직 관련 자료가 준비되지 않았어요'라고 솔직히 안내",
].join("\n");

const PROMPT_TEMPLATE = [
  "## 검색된 내부 데이터",
  "{{results}}",
  "",
  "## 사용자 질문",
  "{{query}}",
  "",
  "## 규칙",
  "1. 위 내부 데이터만 사용하세요. 데이터에 없는 내용을 지어내지 마세요.",
  "2. 가드레일 규칙에 따라 guardrailStatus를 판단하세요.",
  "3. 상담 분기(scenario)를 판단하고 해당 분기에 맞는 응답 구조를 따르세요.",
  "4. 상황에 가장 적합한 characterTone을 선택하세요.",
  "5. 이번 턴 이후 저장할 nextSessionMemory와, 장기 메모리로 올릴 값이 있으면 nextProfileMemory를 함께 반환하세요.",
  "6. compactSummary는 다음 턴에서 바로 이어질 수 있게 최근 맥락만 1~2문장으로 압축하세요.",
  "7. JSON만 반환하세요.",
].join("\n");

const LLM_MODEL = "gemini-2.5-flash-lite";

function hasRunnableGraph(workflow: Workflow) {
  const graph = workflow.graph as Workflow["graph"] & {
    nodes?: Workflow["graph"]["blocks"];
  };

  const blockCount = Array.isArray(graph.blocks) ? graph.blocks.length : 0;
  const nodeCount = Array.isArray(graph.nodes) ? graph.nodes.length : 0;
  return blockCount > 0 || nodeCount > 0;
}

function getSchiftApiKey() {
  const apiKey = process.env.SCHIFT_API_KEY;
  if (!apiKey) {
    throw new Error("SCHIFT_API_KEY not configured");
  }

  return apiKey;
}

function getSchiftBaseUrl() {
  return "https://api.schift.io";
}

function getSchiftClientOrThrow() {
  const apiKey = getSchiftApiKey();
  if (!apiKey) {
    throw new Error("SCHIFT_API_KEY not configured");
  }

  return new Schift({ apiKey, baseUrl: getSchiftBaseUrl() });
}

async function schiftFetch(path: string, init?: RequestInit) {
  const apiKey = getSchiftApiKey();
  if (!apiKey) {
    throw new Error("SCHIFT_API_KEY not configured");
  }

  const response = await fetch(`${getSchiftBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Schift request failed: ${response.status}`);
  }

  return response.json();
}

export async function patchSchiftWorkflow(
  workflowId: string,
  body: Record<string, unknown>,
) {
  return schiftFetch(`/v1/workflows/${workflowId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

type WorkflowDefinitionRow = {
  id: string;
  name: string;
  slug: string;
  provider: string;
  status: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
};

const GUARDRAIL_PROMPT = [
  "사용자 입력을 분류하세요. JSON만 반환하세요.",
  '{ "route": "safe" | "medical_caution" | "redirect" | "off_topic" }',
  "",
  "- 욕설, 비윤리적 요청, 자해/타해: route='redirect'",
  "- 임신/건강과 무관한 주제(주식, 코인, 맛집 등): route='off_topic'",
  "- 출혈, 극심한 통증, 호흡곤란, 의식 저하 등 응급: route='medical_caution'",
  "- 그 외 안전한 질문: route='safe'",
].join("\n");

const REJECT_ANSWER = [
  "이 질문은 모성간호 상담 범위를 벗어나요.",
  "임신 중 몸 상태나 걱정되는 증상을 적어주시면 그 범위 안에서 다시 도와드릴게요.",
].join(" ");

const EMERGENCY_ANSWER = [
  "안전 안내: 말씀하신 증상은 즉시 의료진 진료가 필요할 수 있어요.",
  "119에 연락하시거나 가까운 응급실을 방문해주세요.",
  "증상이 잠잠해졌더라도 빠른 시일 내에 담당 의료진과 꼭 상의해주세요.",
].join(" ");

/**
 * WorkflowBuilder로 모성간호 상담 RAG 파이프라인 그래프를 구성한다.
 *
 * 블록 구조:
 *   start → ai_router (가드레일)
 *     ├─ [redirect/off_topic] → reject_answer → end
 *     ├─ [medical_caution]    → emergency_answer → end
 *     └─ [safe]               → retriever → reranker → prompt_template → llm → answer → end
 *
 * - ai_router: 가드레일 사전 분류 (LLM 호출 전 비용 절감)
 * - retriever: pregnancy-knowledge 컬렉션에서 top_k=10 검색
 * - reranker: 검색 결과 상위 5건 재정렬
 * - prompt_template: 상담 전용 프롬프트 (가드레일 로직 분리됨)
 * - llm: gemini-2.5-flash-lite (temperature 0.1)
 * - answer: JSON 포맷 출력
 */
function buildMaternalNursingGraph(): WorkflowGraph {
  const graph = new WorkflowBuilder(DEFAULT_WORKFLOW_NAME)
    .description(DEFAULT_WORKFLOW_DESCRIPTION)
    // ── 입력 ──
    .addBlock("start", {
      type: "start",
      title: "사용자 질문 입력",
    })
    // ── 가드레일 라우터 ──
    .addBlock("guardrail_router", {
      type: "ai_router",
      title: "가드레일 분류",
      config: {
        model: LLM_MODEL,
        prompt: GUARDRAIL_PROMPT,
        routes: ["safe", "medical_caution", "redirect", "off_topic"],
        default_route: "safe",
      },
    })
    // ── 거부 응답 (redirect / off_topic) ──
    .addBlock("reject_answer", {
      type: "answer",
      title: "범위 외 안내",
      config: {
        format: "json",
        static_output: {
          answer: REJECT_ANSWER,
          guardrailStatus: "redirect",
          guardrailReason: "상담 범위를 벗어난 질문입니다.",
          characterTone: "calm",
          scenario: "general",
        },
      },
    })
    // ── 응급 응답 (medical_caution) ──
    .addBlock("emergency_answer", {
      type: "answer",
      title: "응급 안내",
      config: {
        format: "json",
        static_output: {
          answer: EMERGENCY_ANSWER,
          guardrailStatus: "medical_caution",
          guardrailReason: "응급 징후가 감지되었습니다. 즉시 의료기관 방문을 권합니다.",
          characterTone: "anxious",
          scenario: "symptom_counsel",
        },
      },
    })
    // ── RAG 검색 ──
    .addBlock("retriever", {
      type: "retriever",
      title: "임신 지식 검색",
      config: {
        collection: DEFAULT_BUCKET,
        top_k: 10,
        endpoint_url:
          process.env.SCHIFT_EMBEDDING_BASE_URL ?? getSchiftBaseUrl(),
      },
    })
    // ── 검색 결과 재정렬 ──
    .addBlock("reranker", {
      type: "reranker",
      title: "검색 결과 재정렬",
      config: {
        top_k: 5,
      },
    })
    // ── 상담 프롬프트 ──
    .addBlock("prompt_template", {
      type: "prompt_template",
      title: "교수자 감수 프롬프트",
      config: {
        system_prompt: SYSTEM_PROMPT,
        template: PROMPT_TEMPLATE,
      },
    })
    // ── LLM 호출 ──
    .addBlock("llm", {
      type: "llm",
      title: "LLM 응답 생성",
      config: {
        model: LLM_MODEL,
        temperature: 0.1,
        max_tokens: 1024,
      },
    })
    // ── 최종 응답 ──
    .addBlock("answer", {
      type: "answer",
      title: "JSON 응답 포맷",
      config: {
        format: "json",
        include_sources: true,
      },
    })
    .addBlock("end", {
      type: "end",
      title: "종료",
    })
    // ── 연결: 가드레일 분기 ──
    .connect("start", "guardrail_router", "out", "in")
    .connect("guardrail_router", "reject_answer", "redirect", "in")
    .connect("guardrail_router", "reject_answer", "off_topic", "in")
    .connect("guardrail_router", "emergency_answer", "medical_caution", "in")
    .connect("guardrail_router", "retriever", "safe", "query")
    // ── 연결: RAG → LLM ──
    .connect("retriever", "reranker", "results", "results")
    .connect("start", "reranker", "out", "query")
    .connect("reranker", "prompt_template", "reranked", "vars")
    .connect("prompt_template", "llm", "prompt", "prompt")
    .connect("llm", "answer", "response", "response")
    // ── 연결: 종료 ──
    .connect("reject_answer", "end", "out", "in")
    .connect("emergency_answer", "end", "out", "in")
    .connect("answer", "end", "out", "in")
    .buildGraph();

  // Schift API가 일부 경로에서 graph.nodes만 영속하는 경우가 있어 동기화해서 전달한다.
  return {
    ...graph,
    nodes: graph.blocks,
  } as WorkflowGraph;
}

export async function listSchiftWorkflows(): Promise<Workflow[]> {
  const summaries = (await schiftFetch("/v1/workflows")) as Workflow[];

  const detailed = await Promise.all(
    summaries.map(async (wf) => {
      try {
        return (await schiftFetch(`/v1/workflows/${wf.id}`)) as Workflow;
      } catch {
        return wf;
      }
    }),
  );

  return detailed;
}

export async function createDefaultInternalAnswerWorkflow() {
  const workflows = await listSchiftWorkflows();
  const existing = workflows.find(
    (workflow) => workflow.name === DEFAULT_WORKFLOW_NAME,
  );
  const schiftClient = getSchiftClientOrThrow();

  const graph = buildMaternalNursingGraph();

  let baseWorkflow = existing;

  if (!baseWorkflow || !hasRunnableGraph(baseWorkflow)) {
    if (baseWorkflow && !hasRunnableGraph(baseWorkflow)) {
      try {
        await patchSchiftWorkflow(baseWorkflow.id, {
          status: "archived",
        });
      } catch (error) {
        console.error("failed to archive malformed Schift workflow", error);
      }
    }

    baseWorkflow = await schiftClient.workflows.create({
      name: DEFAULT_WORKFLOW_NAME,
      description: DEFAULT_WORKFLOW_DESCRIPTION,
      graph,
    });
  }

  const adminMetadata = {
    trigger: "내부 데이터만 답변",
    retrievalScope: `${DEFAULT_BUCKET} 내부 자료`,
    modelName: LLM_MODEL,
  };

  // Schift API graph PATCH에서 nodes/blocks가 유실될 수 있어 메타데이터만 업데이트한다.
  const updated = await patchSchiftWorkflow(baseWorkflow.id, {
    status: "published",
    name: DEFAULT_WORKFLOW_NAME,
    description: `<!-- si-admin-workflow:${JSON.stringify(adminMetadata)}-->\n${DEFAULT_WORKFLOW_DESCRIPTION}`,
  });

  const currentRowsById = await supabaseSelect<WorkflowDefinitionRow[]>(
    `workflow_definitions?select=id,name,slug,provider,status,is_active,config,metadata&id=eq.${updated.id}&limit=1`,
  );
  const currentRowsBySlug =
    currentRowsById.length > 0
      ? currentRowsById
      : await supabaseSelect<WorkflowDefinitionRow[]>(
          "workflow_definitions?select=id,name,slug,provider,status,is_active,config,metadata&slug=eq.internal-data-answer&limit=1",
        );
  const payload = {
    id: updated.id,
    name: updated.name,
    slug: "internal-data-answer",
    provider: "schift",
    status: "published",
    is_active: true,
    config: {
      modelName: LLM_MODEL,
      retrievalScope: `${DEFAULT_BUCKET} 내부 자료`,
    },
    metadata: adminMetadata,
    updated_at: new Date().toISOString(),
  };

  if (currentRowsBySlug[0]) {
    await supabaseUpdate(`workflow_definitions?id=eq.${currentRowsBySlug[0].id}`, payload);
  } else {
    await supabaseInsert("workflow_definitions", {
      ...payload,
      created_at: new Date().toISOString(),
    });
  }

  return updated;
}
