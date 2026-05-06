/**
 * 관리자용 subworkflow YAML 읽기/쓰기.
 *
 * GET  /api/admin/workflow-rules/subworkflows/{name}   → GCS 에서 읽어 YAML 반환
 * PUT  /api/admin/workflow-rules/subworkflows/{name}   → body(YAML text) 를 GCS 에 저장
 *
 * name ∈ { baby-info, letter-reflection, free-chat, general, router, monolith }
 * 실제 GCS 위치는 workflow_definitions 의 YAML 위치 컬럼에서 읽습니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { parse as parseYaml } from "yaml";
import type { Schift, WorkflowGraph } from "@schift-io/sdk";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { prisma } from "@gynecology-chatbot/db/prisma";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { refreshWorkflowFromStorage } from "@/lib/mobile/workflows/load-workflow-yaml";
import {
  WORKFLOW_STAGE_MAPPING_BY_NAME,
  recordAdminWorkflowYamlSave,
  resolveAdminWorkflowYamlLocation,
} from "@/lib/admin/workflow-yaml-location";

const STAGE_MAPPING_KEY = "workflow_stage_mapping";

type WorkflowYaml = {
  name: string;
  description?: string;
  admin_metadata?: {
    trigger?: string;
    retrieval_scope?: string;
    model_name?: string;
    stage?: string;
    scenario?: string;
  };
  prompts?: Record<string, string>;
  blocks: Array<{
    id: string;
    type: string;
    title?: string;
    config?: Record<string, unknown>;
  }>;
  edges: Array<{
    source: string;
    target: string;
    source_handle?: string;
    target_handle?: string;
  }>;
};

function getStorage(): Storage {
  return new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
}

function resolvePromptRefs(
  config: Record<string, unknown> | undefined,
  prompts: Record<string, string>,
): Record<string, unknown> {
  if (!config) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string" && value.startsWith("$prompts.")) {
      const promptKey = value.slice("$prompts.".length);
      out[key] = prompts[promptKey] ?? value;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function parseWorkflowYaml(body: string): WorkflowYaml | null {
  const parsed = parseYaml(body) as Partial<WorkflowYaml> | null;
  if (
    !parsed ||
    typeof parsed.name !== "string" ||
    !Array.isArray(parsed.blocks) ||
    !Array.isArray(parsed.edges)
  ) {
    return null;
  }
  return {
    name: parsed.name,
    description: parsed.description,
    admin_metadata: parsed.admin_metadata,
    prompts: parsed.prompts ?? {},
    blocks: parsed.blocks,
    edges: parsed.edges,
  };
}

async function getMappedWorkflowId(name: string) {
  const location = await resolveAdminWorkflowYamlLocation(name);
  const routeName = location?.routeName;
  const mappingKey = routeName
    ? WORKFLOW_STAGE_MAPPING_BY_NAME[routeName].mappingKey
    : null;
  if (!mappingKey) return null;

  const row = await prisma.system_config.findUnique({
    where: { key: STAGE_MAPPING_KEY },
    select: { value: true },
  });
  const value = row?.value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const mapped = (value as Record<string, unknown>)[mappingKey];
    if (typeof mapped === "string" && mapped.trim()) return mapped.trim();
  }
  return null;
}

async function syncWorkflowToSchift(
  schift: Schift,
  workflowId: string,
  workflow: WorkflowYaml,
) {
  const current = await schift.workflows.get(workflowId);
  const graph = current.graph as typeof current.graph & {
    nodes?: typeof current.graph.blocks;
  };
  for (const block of graph.nodes ?? graph.blocks ?? []) {
    try {
      await schift.workflows.removeBlock(workflowId, block.id);
    } catch {
      // Schift may already have normalized or removed provider-side ids.
    }
  }

  const blockIdMap = new Map<string, string>();
  const prompts = workflow.prompts ?? {};
  for (const block of workflow.blocks) {
    const added = await schift.workflows.addBlock(workflowId, {
      type: block.type as WorkflowGraph["blocks"][number]["type"],
      title: block.title ?? block.id,
      config: resolvePromptRefs(block.config, prompts),
    });
    blockIdMap.set(block.id, added.id);
  }

  for (const edge of workflow.edges) {
    await schift.workflows.addEdge(workflowId, {
      source: blockIdMap.get(edge.source) ?? edge.source,
      target: blockIdMap.get(edge.target) ?? edge.target,
      source_handle: edge.source_handle ?? "out",
      target_handle: edge.target_handle ?? "in",
    });
  }

  await (
    schift as unknown as {
      workflows: {
        update: (id: string, body: Record<string, unknown>) => Promise<unknown>;
      };
    }
  ).workflows.update(workflowId, {
    name: workflow.name,
    description: workflow.description ?? "",
    status: "published",
  });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { name } = await context.params;
  const location = await resolveAdminWorkflowYamlLocation(name);
  if (!location) {
    return NextResponse.json(
      { error: `unknown subworkflow: ${name}` },
      { status: 400 },
    );
  }
  try {
    const [buffer] = await getStorage()
      .bucket(location.bucket)
      .file(location.objectPath)
      .download();
    return new NextResponse(buffer.toString("utf-8"), {
      headers: { "Content-Type": "text/yaml; charset=utf-8" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to read subworkflow yaml",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { name } = await context.params;
  const location = await resolveAdminWorkflowYamlLocation(name);
  if (!location) {
    return NextResponse.json(
      { error: `unknown subworkflow: ${name}` },
      { status: 400 },
    );
  }
  const body = await request.text();
  if (!body.trim()) {
    return NextResponse.json({ error: "empty body" }, { status: 400 });
  }
  const parsedWorkflow = parseWorkflowYaml(body);
  if (!parsedWorkflow) {
    return NextResponse.json(
      { error: "invalid yaml: missing name/blocks" },
      { status: 400 },
    );
  }
  try {
    await getStorage()
      .bucket(location.bucket)
      .file(location.objectPath)
      .save(body, {
        resumable: false,
        contentType: "text/yaml",
        validation: false,
      });
    await recordAdminWorkflowYamlSave(location, body);
    const sync: {
      cacheRefreshed: boolean;
      schift: "synced" | "skipped" | "failed";
      workflowId?: string;
      error?: string;
    } = {
      cacheRefreshed: false,
      schift: "skipped",
    };

    if (location.routeName === "monolith") {
      sync.cacheRefreshed = Boolean(await refreshWorkflowFromStorage());
    } else {
      const workflowId = await getMappedWorkflowId(name);
      const schift = getSchiftClient();
      if (workflowId && schift) {
        sync.workflowId = workflowId;
        try {
          await syncWorkflowToSchift(schift, workflowId, parsedWorkflow);
          sync.schift = "synced";
        } catch (error) {
          sync.schift = "failed";
          sync.error =
            error instanceof Error ? error.message : "failed to sync Schift";
        }
      }
    }

    return NextResponse.json({
      ok: true,
      path: location.storagePath,
      bytes: body.length,
      savedAt: new Date().toISOString(),
      sync,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to save subworkflow yaml",
      },
      { status: 500 },
    );
  }
}
