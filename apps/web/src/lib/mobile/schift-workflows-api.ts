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
  "모성간호 교수자 감수 기반 RAG 워크플로우입니다. 임신 주차별 내부 데이터만 바탕으로 답하고, 가드레일(safe/medical_caution/redirect), 감정 체크인, 상담 분기, 캐릭터 톤을 함께 반환합니다.";

const SYSTEM_PROMPT = [
  "당신은 모성간호학 교수자가 감수한 임산부 상담 어시스턴트입니다.",
  "반드시 내부 데이터(검색된 문맥)만 근거로 답변하세요.",
  "응답은 반드시 JSON 하나만 반환하세요.",
  "",
  "## JSON 스키마",
  "{ answer: string, guardrailStatus: 'safe' | 'medical_caution' | 'redirect', guardrailReason?: string, characterTone: 'calm' | 'joyful' | 'anxious' | 'tired' | 'sad', scenario?: 'emotion_checkin' | 'week_info' | 'symptom_counsel' | 'general' }",
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
  "5. JSON만 반환하세요.",
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

/**
 * WorkflowBuilder로 모성간호 상담 RAG 파이프라인 그래프를 구성한다.
 *
 * 블록 구조:
 *   start → retriever → prompt_template → llm → answer → end
 *
 * - retriever: pregnancy-knowledge 컬렉션에서 top_k=8 검색
 * - prompt_template: 가드레일 + 시나리오 분기 + 캐릭터 톤 시스템 프롬프트
 * - llm: gemini-2.5-flash-lite (temperature 0.1)
 * - answer: JSON 포맷 출력
 */
function buildMaternalNursingGraph(): WorkflowGraph {
  const graph = new WorkflowBuilder(DEFAULT_WORKFLOW_NAME)
    .description(DEFAULT_WORKFLOW_DESCRIPTION)
    .addBlock("start", {
      type: "start",
      title: "사용자 질문 입력",
    })
    .addBlock("retriever", {
      type: "retriever",
      title: "임신 지식 검색",
      config: {
        collection: DEFAULT_BUCKET,
        top_k: 8,
        endpoint_url:
          process.env.SCHIFT_EMBEDDING_BASE_URL ?? getSchiftBaseUrl(),
      },
    })
    .addBlock("prompt_template", {
      type: "prompt_template",
      title: "교수자 감수 프롬프트",
      config: {
        system_prompt: SYSTEM_PROMPT,
        template: PROMPT_TEMPLATE,
      },
    })
    .addBlock("llm", {
      type: "llm",
      title: "LLM 응답 생성",
      config: {
        model: LLM_MODEL,
        temperature: 0.1,
        max_tokens: 1024,
      },
    })
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
    .connect("start", "retriever")
    .connect("retriever", "prompt_template")
    .connect("prompt_template", "llm")
    .connect("llm", "answer")
    .connect("answer", "end")
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
