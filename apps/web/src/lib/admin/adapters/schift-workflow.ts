import type {
  AdminWorkflowBlock,
  AdminWorkflowRule,
  AdminWorkflowRuleInput,
} from "@gynecology-chatbot/app-core";
import type { Workflow } from "@schift-io/sdk";

const ADMIN_META_PREFIX = "<!-- si-admin-workflow:";
const ADMIN_META_SUFFIX = "-->";

type SchiftWorkflowAdminMeta = {
  trigger?: string;
  retrievalScope?: string;
  modelName?: string;
};

function getWorkflowBlocks(workflow: Workflow) {
  const graph = workflow.graph as Workflow["graph"] & {
    blocks?: Array<{ type: string; config?: Record<string, unknown> }>;
    nodes?: Array<{ type: string; config?: Record<string, unknown> }>;
  };

  return graph.blocks ?? graph.nodes ?? [];
}

function parseAdminMeta(description: string | null | undefined) {
  const text = description?.trim() ?? "";
  if (!text.startsWith(ADMIN_META_PREFIX)) {
    return { meta: {} as SchiftWorkflowAdminMeta, body: text };
  }

  const suffixIndex = text.indexOf(ADMIN_META_SUFFIX);
  if (suffixIndex === -1) {
    return { meta: {} as SchiftWorkflowAdminMeta, body: text };
  }

  const jsonText = text.slice(ADMIN_META_PREFIX.length, suffixIndex).trim();

  try {
    const parsed = JSON.parse(jsonText) as SchiftWorkflowAdminMeta;
    const body = text.slice(suffixIndex + ADMIN_META_SUFFIX.length).trim();
    return { meta: parsed, body };
  } catch {
    return { meta: {} as SchiftWorkflowAdminMeta, body: text };
  }
}

function inferModelName(workflow: Workflow) {
  const blocks = getWorkflowBlocks(workflow);
  const llmBlock = blocks.find((block) => block.type === "llm");
  const selectorBlock = blocks.find((block) => block.type === "model_selector");

  const llmModel = llmBlock?.config?.model;
  if (typeof llmModel === "string" && llmModel.trim()) {
    return llmModel.trim();
  }

  const selectorModel = selectorBlock?.config?.modelName;
  if (typeof selectorModel === "string" && selectorModel.trim()) {
    return selectorModel.trim();
  }

  return "미설정";
}

function inferRetrievalScope(workflow: Workflow) {
  const blocks = getWorkflowBlocks(workflow);
  const collectionBlock = blocks.find((block) => block.type === "collection");
  const retrieverBlock = blocks.find((block) => block.type === "retriever");

  const collectionName = collectionBlock?.config?.collection;
  if (typeof collectionName === "string" && collectionName.trim()) {
    return collectionName.trim();
  }

  const topK = retrieverBlock?.config?.topK;
  if (typeof topK === "number") {
    return `Schift 검색 상위 ${topK}건`;
  }

  return "Schift workflow";
}

export function mapSchiftWorkflowRule(workflow: Workflow): AdminWorkflowRule {
  const { meta } = parseAdminMeta(workflow.description);
  const rawBlocks = getWorkflowBlocks(workflow);

  const blocks: AdminWorkflowBlock[] = rawBlocks.map((block, index) => ({
    id: (block as { id?: string }).id ?? `block-${index}`,
    type: block.type,
    title: (block as { title?: string }).title,
    config: block.config,
  }));

  return {
    id: workflow.id,
    name: workflow.name,
    trigger:
      typeof meta.trigger === "string" && meta.trigger.trim()
        ? meta.trigger.trim()
        : "Schift workflow",
    retrievalScope:
      typeof meta.retrievalScope === "string" && meta.retrievalScope.trim()
        ? meta.retrievalScope.trim()
        : inferRetrievalScope(workflow),
    modelName:
      typeof meta.modelName === "string" && meta.modelName.trim()
        ? meta.modelName.trim()
        : inferModelName(workflow),
    status: workflow.status === "active" ? "active" : "review",
    source: "schift",
    workflowKind: "managed",
    blocks,
  };
}

export function buildSchiftWorkflowDescription(
  input: AdminWorkflowRuleInput,
  currentDescription: string | null | undefined,
) {
  const { body } = parseAdminMeta(currentDescription);
  const meta = JSON.stringify({
    trigger: input.trigger,
    retrievalScope: input.retrievalScope,
    modelName: input.modelName,
  });

  return body
    ? `${ADMIN_META_PREFIX}${meta}${ADMIN_META_SUFFIX}\n${body}`
    : `${ADMIN_META_PREFIX}${meta}${ADMIN_META_SUFFIX}`;
}
