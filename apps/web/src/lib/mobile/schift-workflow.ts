import type { Schift, Workflow, WorkflowRun } from "@schift-io/sdk";
import { listSchiftWorkflows } from "./schift-workflows-api";

function pickActiveWorkflow(workflows: Workflow[]) {
  return (
    workflows.find((workflow) => workflow.status === "active") ??
    workflows[0] ??
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

  const run = await input.schift.workflows.run(
    resolvedWorkflowId,
    input.inputs,
  );

  return {
    workflowId: resolvedWorkflowId,
    run,
  };
}

function summarizeOutput(outputs: Record<string, unknown> | undefined) {
  if (!outputs) {
    return "workflow 출력이 없어요.";
  }

  const answerCandidates = [
    outputs.answer,
    outputs.reply,
    outputs.result,
    outputs.output,
    outputs.text,
    outputs.response,
  ];
  const answer = answerCandidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim(),
  );

  if (typeof answer === "string") {
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
  const answer = summarizeOutput(run.outputs);
  const references = summarizeReferences(run.outputs);

  return references
    ? `답변: ${answer}\n\n참고:\n${references}`
    : `답변: ${answer}`;
}
