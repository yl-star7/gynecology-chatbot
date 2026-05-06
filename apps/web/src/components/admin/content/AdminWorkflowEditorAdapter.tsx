"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  WorkflowEditorProvider,
  WorkflowBuilder,
  type WorkflowEditorAPI,
} from "@schift-io/sdk/workflow-editor";
import type { Workflow, WorkflowRun } from "@schift-io/sdk";

function createAdminWorkflowAPI(base = "/api/admin/schift/workflows"): WorkflowEditorAPI {

  async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.text();
      try {
        const parsed = JSON.parse(body) as { error?: string };
        if (typeof parsed.error === "string" && parsed.error.trim()) {
          throw new Error(parsed.error.trim());
        }
      } catch {
        // Fall back to the raw body when the response is not JSON.
      }
      throw new Error(body || `Request failed: ${res.status}`);
    }
    return (await res.json()) as T;
  }

  /** Ensure graph always has blocks[] and edges[] arrays */
  function normalizeWorkflow(wf: Workflow): Workflow {
    const graph = wf.graph as Workflow["graph"] & {
      nodes?: Workflow["graph"]["blocks"];
    };
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const rawBlocks = Array.isArray(graph.blocks) ? graph.blocks : [];
    const blocks = nodes.length > 0 ? nodes : rawBlocks;
    const edges = graph.edges ?? [];
    const normalizedGraph: Workflow["graph"] = { ...graph, blocks, edges };
    return { ...wf, graph: normalizedGraph };
  }

  return {
    list: () =>
      fetchJSON<Workflow[]>(base).then((items) => items.map(normalizeWorkflow)),
    get: async (id) => {
      try {
        return await fetchJSON<Workflow>(`${base}/${id}`).then(
          normalizeWorkflow,
        );
      } catch (error) {
        const is404 =
          error instanceof Error &&
          (error.message.includes("404") ||
            error.message.includes("not found") ||
            error.message.includes("Workflow not found"));
        if (!is404) throw error;

        // 워크플로우가 Schift에서 삭제됨 — 목록에서 대체 워크플로우를 찾거나 새로 생성
        const workflows = await fetchJSON<Workflow[]>(base).then((items) =>
          items.map(normalizeWorkflow),
        );
        if (workflows.length > 0) return workflows[0];

        throw error;
      }
    },
    create: (req) =>
      fetchJSON<Workflow>(base, {
        method: "POST",
        body: JSON.stringify(req),
      }).then(normalizeWorkflow),
    update: (id, req) =>
      fetchJSON<Workflow>(`${base}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(req),
      }).then(normalizeWorkflow),
    delete: async (id) => {
      await fetchJSON<unknown>(`${base}/${id}`, { method: "DELETE" });
    },
    run: (id, inputs) =>
      fetchJSON<WorkflowRun>(`${base}/${id}/run`, {
        method: "POST",
        body: JSON.stringify({ query: "", ...inputs }),
      }),
    validate: async () => ({ valid: true, errors: [] }),
  };
}

interface Props {
  workflowId?: string | null;
  apiBase?: string;
  onBack: () => void;
}

export function AdminWorkflowEditorAdapter({ workflowId, apiBase, onBack }: Props) {
  const api = useMemo(() => createAdminWorkflowAPI(apiBase), [apiBase]);
  const handleBack = useCallback(() => onBack(), [onBack]);
  const editorRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = editorRootRef.current;
    if (!root) return;
    const rootNode = root;

    function normalizeRunButtonLabel() {
      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        const text = node.textContent;
        if (text?.includes("&blacktriangleright;")) {
          node.textContent = text.replace(/&blacktriangleright;\s*/g, "");
        }
        node = walker.nextNode();
      }
    }

    normalizeRunButtonLabel();

    const observer = new MutationObserver(normalizeRunButtonLabel);
    observer.observe(rootNode, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <WorkflowEditorProvider api={api}>
      <div
        ref={editorRootRef}
        className="schift-editor-root h-full min-h-[500px] [--schift-black:#0a0a0f] [--schift-blue:#3b82f6] [--schift-gray-100:#111118] [--schift-gray-30:#b0b0c8] [--schift-gray-50:#71718a] [--schift-gray-60:#50506b] [--schift-gray-70:#35354a] [--schift-gray-80:#252530] [--schift-gray-90:#1a1a24] [--schift-green:#10b981] [--schift-red:#ef4444] [--schift-white:#e8e8f0] [--schift-yellow:#f59e0b]"
      >
        <WorkflowBuilder
          initialWorkflowId={workflowId ?? null}
          onBack={handleBack}
        />
      </div>
    </WorkflowEditorProvider>
  );
}
