"use client";

import { useMemo } from "react";
import { useCallback } from "react";
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
      throw new Error(body || `Request failed: ${res.status}`);
    }
    return res.json();
  }

  return {
    list: () => fetchJSON(base),
    get: (id) => fetchJSON(`${base}/${id}`),
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

export function AdminWorkflowEditorAdapter({ workflowId, onBack }: Props) {
  const api = useMemo(() => createAdminWorkflowAPI(), []);
  const handleBack = useCallback(() => onBack(), [onBack]);

  return (
    <WorkflowEditorProvider api={api}>
      <div style={{ height: "100%", minHeight: 500 }}>
        <WorkflowBuilder
          initialWorkflowId={workflowId ?? null}
          onBack={handleBack}
        />
      </div>
    </WorkflowEditorProvider>
  );
}
