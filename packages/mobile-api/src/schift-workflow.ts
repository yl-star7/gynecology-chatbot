import type { Schift, Workflow, WorkflowRun } from "@schift-io/sdk";
import { listSchiftWorkflows } from "./schift-workflows-api";

function hasRunnableGraph(workflow: Workflow) {
  const graph = workflow.graph as Workflow["graph"] & {
    nodes?: Workflow["graph"]["blocks"];
  };

  const blockCount = Array.isArray(graph.blocks) ? graph.blocks.length : 0;
  const nodeCount = Array.isArray(graph.nodes) ? graph.nodes.length : 0;
  return blockCount > 0 || nodeCount > 0;
}

function isCanonicalInternalAnswerWorkflow(workflow: Workflow) {
  if (workflow.name !== "모성간호 상담 응답") {
    return false;
  }

  const description = workflow.description ?? "";
  return description.includes('"trigger":"내부 데이터만 답변"');
}

function pickActiveWorkflow(workflows: Workflow[]) {
  const runnable = workflows.filter(hasRunnableGraph);
  const activeRunnable = runnable.filter(
    (workflow) =>
      workflow.status === "active" ||
      (workflow.status as string) === "published",
  );

  return (
    activeRunnable.find(isCanonicalInternalAnswerWorkflow) ??
    activeRunnable[0] ??
    runnable.find(isCanonicalInternalAnswerWorkflow) ??
    runnable[0] ??
    null
  );
}

export async function resolveSchiftWorkflowId(
  schift: Schift,
  workflowId?: string,
) {
  if (workflowId?.trim()) {
    return workflowId.trim();
  }

  const workflows = await listSchiftWorkflows();
  return pickActiveWorkflow(workflows)?.id ?? null;
}

export async function runSchiftWorkflow(input: {
  schift: Schift;
  workflowId?: string;
  inputs: Record<string, unknown>;
}) {
  const resolvedWorkflowId = await resolveSchiftWorkflowId(
    input.schift,
    input.workflowId,
  );

  if (!resolvedWorkflowId) {
    throw new Error("No Schift workflow available");
  }

  try {
    const workflow = await input.schift.workflows.get(resolvedWorkflowId);
    const outputBlockId = resolveWorkflowOutputBlockId(workflow);
    const run = outputBlockId
      ? await runSchiftWorkflowWithOutput(
          resolvedWorkflowId,
          input.inputs,
          outputBlockId,
        )
      : await input.schift.workflows.run(resolvedWorkflowId, input.inputs);

    return {
      workflowId: resolvedWorkflowId,
      run,
    };
  } catch (error) {
    const is404 =
      error instanceof Error &&
      (error.message.includes("404") || error.message.includes("not found"));
    if (!is404) throw error;

    // 워크플로우가 Schift에서 삭제됨 — 목록에서 다시 resolve
    const fallbackId = await resolveSchiftWorkflowId(input.schift);
    if (!fallbackId || fallbackId === resolvedWorkflowId) {
      throw error;
    }

    const workflow = await input.schift.workflows.get(fallbackId);
    const outputBlockId = resolveWorkflowOutputBlockId(workflow);
    const run = outputBlockId
      ? await runSchiftWorkflowWithOutput(
          fallbackId,
          input.inputs,
          outputBlockId,
        )
      : await input.schift.workflows.run(fallbackId, input.inputs);
    return { workflowId: fallbackId, run };
  }
}

function resolveWorkflowOutputBlockId(workflow: Workflow) {
  const graph = workflow.graph as Workflow["graph"] & {
    nodes?: Workflow["graph"]["blocks"];
  };
  const blocks = graph.nodes ?? graph.blocks ?? [];
  const explicitAnswer = blocks.find(
    (block) =>
      block.type === "answer" &&
      ((block.title ?? "").includes("JSON 응답") ||
        (block.config as Record<string, unknown> | undefined)?.include_sources),
  );
  return (
    explicitAnswer?.id ?? blocks.find((block) => block.type === "answer")?.id
  );
}

async function runSchiftWorkflowWithOutput(
  workflowId: string,
  inputs: Record<string, unknown>,
  output: string,
) {
  const apiKey = process.env.SCHIFT_API_KEY;
  if (!apiKey) {
    throw new Error("SCHIFT_API_KEY not configured");
  }

  const response = await fetch(
    `https://api.schift.io/v1/workflows/${workflowId}/run`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs, output }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Schift workflow run failed: ${response.status}`);
  }

  return (await response.json()) as WorkflowRun;
}

type WorkflowRunLike = {
  outputs?: Record<string, unknown>;
  block_states?: unknown;
};

function readObjectAnswerText(value: Record<string, unknown>) {
  const answerCandidates = [
    value.answer,
    value.reply,
    value.result,
    value.output,
    value.text,
    value.response,
    value.content,
    value.message,
  ];

  const answer = answerCandidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim(),
  );

  return typeof answer === "string" ? answer : null;
}

function isEmptySchiftTextPayload(value: unknown): boolean {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return true;
    try {
      return isEmptySchiftTextPayload(JSON.parse(trimmed));
    } catch {
      return false;
    }
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const text = record.text;
  const sources = record.sources;
  if (
    typeof text === "string" &&
    text.trim() === "" &&
    Array.isArray(sources) &&
    sources.length === 0
  ) {
    return true;
  }

  if ("answer" in record && isEmptySchiftTextPayload(record.answer)) {
    return true;
  }

  if ("result" in record && isEmptySchiftTextPayload(record.result)) {
    return true;
  }

  return false;
}

function hasMeaningfulOutput(output: Record<string, unknown>) {
  if (Object.keys(output).length === 0) return false;
  if (isEmptySchiftTextPayload(output)) return false;

  const answer = readObjectAnswerText(output);
  if (answer && isEmptySchiftTextPayload(answer)) return false;

  return true;
}

function hasAnswerLikeOutput(output: Record<string, unknown>) {
  const answer = readObjectAnswerText(output);
  return Boolean(answer && !isEmptySchiftTextPayload(answer));
}

function readBlockStateOutputs(blockState: unknown) {
  if (!blockState || typeof blockState !== "object") {
    return null;
  }

  const state = blockState as {
    output?: unknown;
    outputs?: unknown;
  };

  const candidates = [state.outputs, state.output];
  for (const candidate of candidates) {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      continue;
    }

    const outputRecord = candidate as Record<string, unknown>;
    if (
      hasMeaningfulOutput(outputRecord) &&
      hasAnswerLikeOutput(outputRecord)
    ) {
      return outputRecord;
    }
  }

  return null;
}

export function extractSchiftWorkflowOutputs(run: WorkflowRunLike) {
  if (run.outputs && hasMeaningfulOutput(run.outputs)) {
    return run.outputs;
  }

  const blockStates = run.block_states;
  if (!blockStates) {
    return undefined;
  }

  if (Array.isArray(blockStates)) {
    for (const blockState of blockStates) {
      const output = readBlockStateOutputs(blockState);
      if (output) {
        return output;
      }
    }

    return undefined;
  }

  if (typeof blockStates === "object") {
    for (const blockState of Object.values(
      blockStates as Record<string, unknown>,
    )) {
      const output = readBlockStateOutputs(blockState);
      if (output) {
        return output;
      }
    }
  }

  return undefined;
}

function summarizeOutput(outputs: Record<string, unknown> | undefined) {
  if (!outputs) {
    return "workflow 출력이 없어요.";
  }

  const answer = readObjectAnswerText(outputs);
  if (answer) {
    return answer;
  }

  return JSON.stringify(outputs, null, 2);
}

function summarizeReferences(outputs: Record<string, unknown> | undefined) {
  const references = outputs?.references;
  if (!Array.isArray(references) || references.length === 0) {
    return "";
  }

  return references
    .map((reference, index) => {
      if (typeof reference === "string") {
        return `[${index + 1}] ${reference}`;
      }

      return `[${index + 1}] ${JSON.stringify(reference)}`;
    })
    .join("\n");
}

export function formatSchiftWorkflowRun(run: WorkflowRun) {
  const outputs = extractSchiftWorkflowOutputs(run);
  const answer = summarizeOutput(outputs);
  const references = summarizeReferences(outputs);

  return references
    ? `답변: ${answer}\n\n참고:\n${references}`
    : `답변: ${answer}`;
}
