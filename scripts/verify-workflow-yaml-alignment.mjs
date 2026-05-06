#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const ROOT = process.cwd();
const WORKFLOW_DIR = path.join(
  ROOT,
  "packages/mobile-api/src/workflows",
);
const SUBWORKFLOW_DIR = path.join(WORKFLOW_DIR, "subworkflows");

const workflowFiles = [
  "maternal-nursing.yaml",
  "maternal-nursing-router.yaml",
  ...fs
    .readdirSync(SUBWORKFLOW_DIR)
    .filter((file) => file.endsWith(".yaml"))
    .sort()
    .map((file) => path.join("subworkflows", file)),
].map((file) => path.join(WORKFLOW_DIR, file));

function stripCommentLines(text) {
  return text
    .split(/\n/)
    .map((line) => (line.trimStart().startsWith("#") ? "" : line))
    .join("\n");
}

function validateWorkflow(filePath) {
  const relativePath = path.relative(ROOT, filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  const searchable = stripCommentLines(raw);
  const workflow = parse(raw);
  const errors = [];

  if (!workflow || typeof workflow !== "object") {
    return { relativePath, errors: ["YAML root must be an object"] };
  }

  const blocks = Array.isArray(workflow.blocks) ? workflow.blocks : [];
  const edges = Array.isArray(workflow.edges) ? workflow.edges : [];
  const blockIds = blocks.map((block) => block?.id).filter(Boolean);
  const blockIdSet = new Set(blockIds);

  if (!workflow.name) errors.push("missing name");
  if (!workflow.description) errors.push("missing description");
  if (blocks.length === 0) errors.push("missing blocks");
  if (edges.length === 0) errors.push("missing edges");

  for (const block of blocks) {
    if (!block?.id) errors.push("block missing id");
    if (!block?.type) errors.push(`block ${block?.id ?? "?"} missing type`);
  }

  for (const id of blockIds) {
    if (blockIds.indexOf(id) !== blockIds.lastIndexOf(id)) {
      errors.push(`duplicate block id ${id}`);
    }
  }

  for (const [index, edge] of edges.entries()) {
    if (!blockIdSet.has(edge.source)) {
      errors.push(`edge ${index} source not found: ${edge.source}`);
    }
    if (!blockIdSet.has(edge.target)) {
      errors.push(`edge ${index} target not found: ${edge.target}`);
    }
  }

  const prompts = workflow.prompts ?? {};
  const staticResponses = workflow.static_responses ?? {};
  const config = workflow.config ?? {};
  const refs = [
    ...searchable.matchAll(
      /\$(prompts|static_responses|config|env)\.([A-Za-z_][A-Za-z0-9_]*)/g,
    ),
  ].map((match) => ({ section: match[1], key: match[2] }));

  for (const ref of refs) {
    if (ref.section === "prompts" && !(ref.key in prompts)) {
      errors.push(`missing prompt ref ${ref.key}`);
    }
    if (ref.section === "static_responses" && !(ref.key in staticResponses)) {
      errors.push(`missing static response ref ${ref.key}`);
    }
    if (ref.section === "config" && !(ref.key in config)) {
      errors.push(`missing config ref ${ref.key}`);
    }
  }

  const envRefs = [
    ...new Set(refs.filter((ref) => ref.section === "env").map((ref) => ref.key)),
  ].sort();

  return {
    relativePath,
    name: workflow.name,
    version: workflow.version ?? null,
    blockCount: blocks.length,
    edgeCount: edges.length,
    envRefs,
    hasChatFlow: Boolean(workflow.chat_flow),
    errors,
  };
}

const report = workflowFiles.map(validateWorkflow);
const errors = report.flatMap((item) =>
  item.errors.map((error) => `${item.relativePath}: ${error}`),
);

console.log(
  JSON.stringify(
    {
      ok: errors.length === 0,
      checkedAt: new Date().toISOString(),
      files: report,
      errors,
    },
    null,
    2,
  ),
);

if (errors.length > 0) {
  process.exitCode = 1;
}
