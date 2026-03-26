import type { Workflow } from "@schift-io/sdk";

import { Schift } from "@schift-io/sdk";
import { supabaseInsert, supabaseUpdate, supabaseSelect } from "@/lib/mobile/supabase-rest";

const DEFAULT_BUCKET = "pregnancy-knowledge";
const DEFAULT_WORKFLOW_NAME = "내부 데이터 응답";
const DEFAULT_WORKFLOW_DESCRIPTION =
  "웹 관리자에서 생성한 기본 RAG 워크플로우입니다. 내부 데이터만 바탕으로 답하고, guardrail 결과와 캐릭터 톤을 함께 반환합니다.";

function getSchiftApiKey() {
  return process.env.SCHIFT_API_KEY ?? "";
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

type WorkflowNode = {
  id: string;
  type: string;
  title?: string;
  config?: Record<string, unknown>;
};

type WorkflowGraphLike = {
  blocks?: WorkflowNode[];
  nodes?: WorkflowNode[];
  edges?: unknown[];
};

function getWorkflowNodes(graph: WorkflowGraphLike | undefined) {
  return graph?.blocks ?? graph?.nodes ?? [];
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

function withUpdatedGraph(workflow: Workflow) {
  const nodes = getWorkflowNodes(workflow.graph as WorkflowGraphLike).map((node) => {
    if (node.type === "vector_store" || node.type === "retriever") {
      return {
        ...node,
        config: {
          ...(node.config ?? {}),
          collection: DEFAULT_BUCKET,
          ...(node.type === "retriever" ? { top_k: 8 } : {}),
        },
      };
    }

    if (node.type === "prompt_template") {
      return {
        ...node,
        config: {
          ...(node.config ?? {}),
          system_prompt:
            "You are a maternal nursing support assistant. Answer only from the retrieved internal context. Return JSON with answer, guardrailStatus, guardrailReason, and characterTone. guardrailStatus must be one of safe, medical_caution, redirect. characterTone must be one of calm, joyful, anxious, tired, sad. If the context is missing or insufficient, say you do not know and ask the operator to add or review the internal data.",
          template:
            "Internal context:\\n{{results}}\\n\\nUser question: {{query}}\\n\\nRules:\\n- Use only the internal context above.\\n- Do not invent facts.\\n- If the context does not answer the question, say so clearly.\\n- If the user input sounds urgent, dangerous, or medically risky, set guardrailStatus to medical_caution and explain why.\\n- If the input is abusive, unrelated, or disallowed, set guardrailStatus to redirect.\\n- Otherwise set guardrailStatus to safe.\\n- Choose the most fitting characterTone for the situation.\\n- Return JSON only.\\n\\nAnswer:",
        },
      };
    }

    if (node.type === "llm") {
      return {
        ...node,
        config: {
          ...(node.config ?? {}),
          model: "gemini-2.5-flash-lite",
          temperature: 0.1,
          max_tokens: 1024,
        },
      };
    }

    return node;
  });

  return {
    ...(workflow.graph ?? {}),
    nodes,
  };
}

export async function listSchiftWorkflows(): Promise<Workflow[]> {
  const client = getSchiftClientOrThrow();
  const summaries = await client.workflows.list();

  // list() doesn't include graph — fetch detail via SDK in parallel
  const detailed = await Promise.all(
    summaries.map(async (wf) => {
      try {
        return await client.workflows.get(wf.id);
      } catch {
        return wf;
      }
    }),
  );

  return detailed;
}

export async function createDefaultInternalAnswerWorkflow() {
  const existing = (await listSchiftWorkflows()).find(
    (workflow) => workflow.name === DEFAULT_WORKFLOW_NAME,
  );
  const client = getSchiftClientOrThrow();

  const baseWorkflow =
    existing ??
    (await client.workflows.create({
      name: DEFAULT_WORKFLOW_NAME,
      description: DEFAULT_WORKFLOW_DESCRIPTION,
      template: "basic_rag",
    }));

  const updated = await patchSchiftWorkflow(baseWorkflow.id, {
    status: "published",
    name: DEFAULT_WORKFLOW_NAME,
    description: `<!-- si-admin-workflow:${JSON.stringify({
      trigger: "내부 데이터만 답변",
      retrievalScope: `${DEFAULT_BUCKET} 내부 자료`,
      modelName: "gemini-2.5-flash-lite",
    })}-->\n${DEFAULT_WORKFLOW_DESCRIPTION}`,
    graph: withUpdatedGraph(baseWorkflow),
  });

  const currentRows = await supabaseSelect<WorkflowDefinitionRow[]>(
    `workflow_definitions?select=id,name,slug,provider,status,is_active,config,metadata&id=eq.${updated.id}&limit=1`,
  );
  const payload = {
    id: updated.id,
    name: updated.name,
    slug: "internal-data-answer",
    provider: "schift",
    status: "published",
    is_active: true,
    config: {
      modelName: "gemini-2.5-flash-lite",
      retrievalScope: `${DEFAULT_BUCKET} 내부 자료`,
    },
    metadata: {
      trigger: "내부 데이터만 답변",
      retrievalScope: `${DEFAULT_BUCKET} 내부 자료`,
      modelName: "gemini-2.5-flash-lite",
    },
    updated_at: new Date().toISOString(),
  };

  if (currentRows[0]) {
    await supabaseUpdate(`workflow_definitions?id=eq.${updated.id}`, payload);
  } else {
    await supabaseInsert("workflow_definitions", {
      ...payload,
      created_at: new Date().toISOString(),
    });
  }

  return updated;
}
