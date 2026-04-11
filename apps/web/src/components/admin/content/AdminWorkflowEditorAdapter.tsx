"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import {
  WorkflowEditorProvider,
  WorkflowBuilder,
  type WorkflowEditorAPI,
} from "@schift-io/sdk/workflow-editor";
import type { Workflow, WorkflowRun } from "@schift-io/sdk";

function createAdminWorkflowAPI(): WorkflowEditorAPI {
  const base = "/api/admin/schift/workflows";

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

        // 워크플로우가 아예 없으면 기본 워크플로우 부트스트랩
        await fetch("/api/admin/workflow-rules/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const refreshed = await fetchJSON<Workflow[]>(base).then((items) =>
          items.map(normalizeWorkflow),
        );
        if (refreshed.length > 0) return refreshed[0];

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
      <div
        className="schift-editor-root"
        style={{ height: "100%", minHeight: 500, ...SCHIFT_THEME_VARS }}
      >
        <WorkflowBuilder
          initialWorkflowId={workflowId ?? null}
          onBack={handleBack}
        />
      </div>
    </WorkflowEditorProvider>
  );
}
