import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { Schift, Workflow, WorkflowGraph } from "@schift-io/sdk";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { prisma } from "@gynecology-chatbot/db/prisma";

const BUCKET = process.env.GCS_WORKFLOW_BUCKET ?? "agaya-workflow-config";
const STAGE_MAPPING_KEY = "workflow_stage_mapping";

type Ctx = { params: Promise<{ name: string }> };

type WorkflowYaml = {
  version?: number;
  name: string;
  description?: string;
  admin_metadata?: Record<string, unknown>;
  prompts?: Record<string, string>;
  static_responses?: Record<string, unknown>;
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

function getStorage() {
  return new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
}

function resolvePath(name: string) {
  if (name === "router") return "maternal-nursing-router.yaml";
  if (name === "monolith") return "maternal-nursing.yaml";
  const allowed = ["baby-info", "letter-reflection", "free-chat", "general"];
  if (!allowed.includes(name)) return null;
  return `subworkflows/${name}.yaml`;
}

function parseWorkflowYaml(text: string): WorkflowYaml {
  const yaml = parseYaml(text) as WorkflowYaml;
  if (!yaml?.name || !Array.isArray(yaml.blocks) || !Array.isArray(yaml.edges)) {
    throw new Error("invalid yaml workflow");
  }
  return yaml;
}

function toWorkflow(id: string, yaml: WorkflowYaml): Workflow {
  const now = new Date().toISOString();
  const blocks = yaml.blocks.map((block, index) => ({
    id: block.id,
    type: block.type as WorkflowGraph["blocks"][number]["type"],
    title: block.title ?? block.id,
    position: { x: 100 + index * 220, y: 120 },
    config: block.config ?? {},
  }));
  return {
    id,
    name: yaml.name,
    description: yaml.description ?? "",
    status: "active",
    graph: {
      blocks,
      nodes: blocks,
      edges: yaml.edges.map((edge, index) => ({
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        source_handle: edge.source_handle,
        target_handle: edge.target_handle,
      })),
    } as WorkflowGraph,
    created_at: now,
    updated_at: now,
  };
}

function graphToYamlBlocks(graph: Record<string, unknown>) {
  const blocks = (graph.nodes ?? graph.blocks ?? []) as Array<
    Record<string, unknown>
  >;
  return blocks.map((block) => ({
    id: String(block.id),
    type: String(block.type),
    title:
      typeof block.title === "string" && block.title.trim()
        ? block.title
        : String(block.id),
    config:
      block.config && typeof block.config === "object"
        ? (block.config as Record<string, unknown>)
        : {},
  }));
}

function graphToYamlEdges(graph: Record<string, unknown>) {
  const edges = (graph.edges ?? []) as Array<Record<string, unknown>>;
  return edges.map((edge) => ({
    source: String(edge.source),
    target: String(edge.target),
    source_handle:
      typeof edge.source_handle === "string" ? edge.source_handle : undefined,
    target_handle:
      typeof edge.target_handle === "string" ? edge.target_handle : undefined,
  }));
}

function resolvePromptRefs(
  config: Record<string, unknown> | undefined,
  prompts: Record<string, string>,
) {
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

async function getMappedWorkflowId(name: string) {
  const keyByName: Record<string, string> = {
    "baby-info": "baby_info",
    "letter-reflection": "letter_reflection",
    "free-chat": "free_chat",
    general: "general",
    router: "router",
  };
  const envByName: Record<string, string> = {
    "baby-info": "SCHIFT_WF_BABY_INFO",
    "letter-reflection": "SCHIFT_WF_LETTER_REFLECTION",
    "free-chat": "SCHIFT_WF_FREE_CHAT",
    general: "SCHIFT_WF_GENERAL",
    router: "SCHIFT_WF_ROUTER",
  };
  const mappingKey = keyByName[name];
  if (!mappingKey) return null;

  try {
    const row = await prisma.system_config.findUnique({
      where: { key: STAGE_MAPPING_KEY },
      select: { value: true },
    });
    const value = row?.value;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const mapped = (value as Record<string, unknown>)[mappingKey];
      if (typeof mapped === "string" && mapped.trim()) return mapped.trim();
    }
  } catch {
    // Env fallback keeps editor save usable during DB outages.
  }

  const envKey = envByName[name];
  return envKey ? (process.env[envKey]?.trim() ?? null) : null;
}

async function syncWorkflowToSchift(
  schift: Schift,
  workflowId: string,
  yaml: WorkflowYaml,
) {
  const current = await schift.workflows.get(workflowId);
  const graph = current.graph as typeof current.graph & {
    nodes?: typeof current.graph.blocks;
  };
  for (const block of graph.nodes ?? graph.blocks ?? []) {
    try {
      await schift.workflows.removeBlock(workflowId, block.id);
    } catch {
      // Provider may have already normalized ids.
    }
  }

  const blockIdMap = new Map<string, string>();
  const prompts = yaml.prompts ?? {};
  for (const block of yaml.blocks) {
    const added = await schift.workflows.addBlock(workflowId, {
      type: block.type as WorkflowGraph["blocks"][number]["type"],
      title: block.title ?? block.id,
      config: resolvePromptRefs(block.config, prompts),
    });
    blockIdMap.set(block.id, added.id);
  }

  for (const edge of yaml.edges) {
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
    name: yaml.name,
    description: yaml.description ?? "",
    status: "published",
  });
}

async function readYaml(name: string) {
  const remotePath = resolvePath(name);
  if (!remotePath) throw new Error(`unknown YAML workflow: ${name}`);
  const [buffer] = await getStorage().bucket(BUCKET).file(remotePath).download();
  return parseWorkflowYaml(buffer.toString("utf-8"));
}

async function saveYaml(name: string, yaml: WorkflowYaml) {
  const remotePath = resolvePath(name);
  if (!remotePath) throw new Error(`unknown YAML workflow: ${name}`);
  await getStorage().bucket(BUCKET).file(remotePath).save(stringifyYaml(yaml), {
    resumable: false,
    contentType: "text/yaml",
    validation: false,
  });
}

export async function GET(_request: NextRequest, context: Ctx) {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { name } = await context.params;
    return NextResponse.json(toWorkflow(name, await readYaml(name)));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { name } = await context.params;
    const current = await readYaml(name);
    const body = (await request.json()) as Record<string, unknown>;
    const graph = body.graph as Record<string, unknown> | undefined;
    const nextYaml: WorkflowYaml = {
      ...current,
      name: typeof body.name === "string" ? body.name : current.name,
      description:
        typeof body.description === "string"
          ? body.description
          : current.description,
      blocks: graph ? graphToYamlBlocks(graph) : current.blocks,
      edges: graph ? graphToYamlEdges(graph) : current.edges,
    };

    await saveYaml(name, nextYaml);

    const workflowId = await getMappedWorkflowId(name);
    const schift = getSchiftClient();
    if (workflowId && schift) {
      await syncWorkflowToSchift(schift, workflowId, nextYaml);
    }

    return NextResponse.json(toWorkflow(name, nextYaml));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}
