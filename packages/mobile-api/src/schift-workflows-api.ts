import type { Workflow, WorkflowGraph } from "@schift-io/sdk";

import { Schift } from "@schift-io/sdk";
import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "./supabase/admin-client";
import { loadMaternalNursingWorkflow } from "./workflows/load-workflow-yaml";

function hasRunnableGraph(workflow: Workflow) {
  const graph = workflow.graph as Workflow["graph"] & {
    nodes?: Workflow["graph"]["blocks"];
  };

  const blockCount = Array.isArray(graph.blocks) ? graph.blocks.length : 0;
  const nodeCount = Array.isArray(graph.nodes) ? graph.nodes.length : 0;
  return blockCount > 0 || nodeCount > 0;
}

function hasMalformedGraph(workflow: Workflow) {
  const graph = workflow.graph as Workflow["graph"] & {
    nodes?: Workflow["graph"]["blocks"];
  };

  const blockCount = Array.isArray(graph.blocks) ? graph.blocks.length : 0;
  const nodeCount = Array.isArray(graph.nodes) ? graph.nodes.length : 0;
  const edgeCount = Array.isArray(graph.edges) ? graph.edges.length : 0;

  return edgeCount > 0 && blockCount === 0 && nodeCount === 0;
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
 * maternal-nursing.yaml에서 워크플로우 그래프를 로드한다.
 *
 * 블록 구조:
 *   start → ai_router (가드레일)
 *     ├─ [redirect/off_topic] → reject_answer → end
 *     ├─ [medical_caution]    → emergency_answer → end
 *     └─ [safe]               → retriever → reranker → prompt_template → llm → answer → end
 */
function buildMaternalNursingGraph(): WorkflowGraph {
  return loadMaternalNursingWorkflow().graph;
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

/**
 * Schift SDK create()는 blocks 키로 보내 config를 유실한다.
 * addBlock/addEdge를 사용해 블록별 config를 영속시킨다.
 */
async function createWorkflowWithBlocks(
  schiftClient: Schift,
  wfDef: ReturnType<typeof loadMaternalNursingWorkflow>,
) {
  const shell = await schiftClient.workflows.create({
    name: wfDef.name,
    description: wfDef.description,
  });

  const blockIdMap = new Map<string, string>();
  for (const block of wfDef.graph.blocks) {
    const added = await schiftClient.workflows.addBlock(shell.id, {
      type: block.type,
      title: block.title ?? block.id,
      config: withProviderKey(block.type, block.config ?? {}),
    });
    blockIdMap.set(block.id, added.id);
  }

  for (const edge of wfDef.graph.edges) {
    const source = blockIdMap.get(edge.source) ?? edge.source;
    const target = blockIdMap.get(edge.target) ?? edge.target;
    await schiftClient.workflows.addEdge(shell.id, {
      source,
      target,
      source_handle: edge.source_handle ?? "output",
      target_handle: edge.target_handle ?? "input",
    });
  }

  return shell;
}

async function syncWorkflowGraphWithBlocks(
  schiftClient: Schift,
  workflowId: string,
  wfDef: ReturnType<typeof loadMaternalNursingWorkflow>,
) {
  const current = await schiftClient.workflows.get(workflowId);
  const currentGraph = current.graph as WorkflowGraph & {
    nodes?: WorkflowGraph["blocks"];
  };

  for (const block of currentGraph.nodes ?? currentGraph.blocks ?? []) {
    try {
      await schiftClient.workflows.removeBlock(workflowId, block.id);
    } catch {
      // Ignore already-removed or provider-normalized block ids.
    }
  }

  const blockIdMap = new Map<string, string>();
  for (const block of wfDef.graph.blocks) {
    const added = await schiftClient.workflows.addBlock(workflowId, {
      type: block.type,
      title: block.title ?? block.id,
      config: withProviderKey(block.type, block.config ?? {}),
    });
    blockIdMap.set(block.id, added.id);
  }

  for (const edge of wfDef.graph.edges) {
    const source = blockIdMap.get(edge.source) ?? edge.source;
    const target = blockIdMap.get(edge.target) ?? edge.target;
    await schiftClient.workflows.addEdge(workflowId, {
      source,
      target,
      source_handle: edge.source_handle ?? "output",
      target_handle: edge.target_handle ?? "input",
    });
  }
}

function withProviderKey(
  blockType: string,
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (blockType !== "ai_router" && blockType !== "llm") {
    return config;
  }

  const apiKey =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_API_KEY;
  if (!apiKey || config.api_key) {
    return config;
  }

  return {
    ...config,
    api_key: apiKey,
  };
}

export async function createDefaultInternalAnswerWorkflow(
  workflowDefinition?: ReturnType<typeof loadMaternalNursingWorkflow>,
) {
  const wfDef = workflowDefinition ?? loadMaternalNursingWorkflow();
  const workflows = await listSchiftWorkflows();
  const existing = workflows.find(
    (workflow) =>
      workflow.name === wfDef.name &&
      ((workflow.status as string) === "published" ||
        workflow.status === "active") &&
      hasRunnableGraph(workflow) &&
      !hasMalformedGraph(workflow),
  );
  const malformed = workflows.find(
    (workflow) => workflow.name === wfDef.name && hasMalformedGraph(workflow),
  );
  const schiftClient = getSchiftClientOrThrow();

  let baseWorkflow = existing ?? null;

  if (!baseWorkflow) {
    if (malformed) {
      try {
        await patchSchiftWorkflow(malformed.id, {
          status: "archived",
        });
      } catch (error) {
        console.error("failed to archive malformed Schift workflow", error);
      }
    }

    baseWorkflow = await createWorkflowWithBlocks(schiftClient, wfDef);
  } else {
    await syncWorkflowGraphWithBlocks(schiftClient, baseWorkflow.id, wfDef);
  }

  const adminMetadata = {
    trigger: wfDef.adminMetadata.trigger,
    retrievalScope: wfDef.adminMetadata.retrieval_scope,
    modelName: wfDef.adminMetadata.model_name,
  };

  const updated = await patchSchiftWorkflow(baseWorkflow.id, {
    status: "published",
    name: wfDef.name,
    description: `<!-- si-admin-workflow:${JSON.stringify(adminMetadata)}-->\n${wfDef.description}`,
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
      modelName: wfDef.adminMetadata.model_name,
      retrievalScope: wfDef.adminMetadata.retrieval_scope,
    },
    metadata: adminMetadata,
    updated_at: new Date().toISOString(),
  };

  if (currentRowsBySlug[0]) {
    await supabaseUpdate(
      `workflow_definitions?id=eq.${currentRowsBySlug[0].id}`,
      payload,
    );
  } else {
    await supabaseInsert("workflow_definitions", {
      ...payload,
      created_at: new Date().toISOString(),
    });
  }

  return updated;
}
