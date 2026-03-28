"use client";

import { useMemo, useCallback } from "react";
import {
  WorkflowEditorProvider,
  WorkflowBuilder,
  type WorkflowEditorAPI,
} from "@schift-io/sdk/workflow-editor";

function createAdminWorkflowAPI(): WorkflowEditorAPI {
  const base = "/api/admin/schift/workflows";

  async function fetchJSON(url: string, init?: RequestInit) {
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
    return res.json();
  }

  /** Ensure graph always has blocks[] and edges[] arrays */
  function normalizeWorkflow(wf: Record<string, unknown>): Record<string, unknown> {
    const graph = (wf.graph ?? {}) as Record<string, unknown>;
    const blocks = (graph.blocks ?? graph.nodes ?? []) as unknown[];
    const edges = (graph.edges ?? []) as unknown[];
    return { ...wf, graph: { ...graph, blocks, edges } };
  }

  return {
    list: () => fetchJSON(base),
    get: (id) => fetchJSON(`${base}/${id}`).then(normalizeWorkflow),
    create: (req) => fetchJSON(base, { method: "POST", body: JSON.stringify(req) }),
    update: (id, req) => fetchJSON(`${base}/${id}`, { method: "PATCH", body: JSON.stringify(req) }),
    delete: (id) => fetchJSON(`${base}/${id}`, { method: "DELETE" }),
    run: (id, inputs) =>
      fetchJSON(`${base}/${id}/run`, {
        method: "POST",
        body: JSON.stringify({ query: "", ...inputs }),
      }),
    validate: async () => ({ valid: true, errors: [] }),
  };
}

interface Props {
  workflowId?: string | null;
  onBack: () => void;
}

const SCHIFT_THEME_VARS: React.CSSProperties & Record<string, string> = {
  "--schift-black": "#0a0a0f",
  "--schift-gray-100": "#111118",
  "--schift-gray-90": "#1a1a24",
  "--schift-gray-80": "#252530",
  "--schift-gray-70": "#35354a",
  "--schift-gray-60": "#50506b",
  "--schift-gray-50": "#71718a",
  "--schift-gray-30": "#b0b0c8",
  "--schift-white": "#e8e8f0",
  "--schift-blue": "#3b82f6",
  "--schift-green": "#10b981",
  "--schift-red": "#ef4444",
  "--schift-yellow": "#f59e0b",
};

export function AdminWorkflowEditorAdapter({ workflowId, onBack }: Props) {
  const api = useMemo(() => createAdminWorkflowAPI(), []);
  const handleBack = useCallback(() => onBack(), [onBack]);

  return (
    <WorkflowEditorProvider api={api}>
      <div className="schift-editor-root" style={{ height: "100%", minHeight: 500, ...SCHIFT_THEME_VARS }}>
        <WorkflowBuilder
          initialWorkflowId={workflowId ?? null}
          onBack={handleBack}
        />
      </div>
    </WorkflowEditorProvider>
  );
}
