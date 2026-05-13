import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import { AdminPoliciesSection } from "./AdminPoliciesSection";

jest.mock("@schift-io/sdk/workflow-editor", () => ({
  WorkflowEditorProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  WorkflowBuilder: ({
    initialWorkflowId,
  }: {
    initialWorkflowId?: string | null;
  }) => <div>워크플로우 빌더 {initialWorkflowId}</div>,
}));

describe("AdminPoliciesSection", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/admin/schift") {
        return new Response(
          JSON.stringify({ error: "SCHIFT_API_KEY not configured" }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("disables the workflow editor when Schift is not configured", async () => {
    render(
      <AdminPoliciesSection
        workflowRules={[
          {
            id: "workflow-1",
            name: "내부 응답",
            trigger: "복통",
            retrievalScope: "내부 문서",
            modelName: "gemini-2.5-flash-lite",
            status: "active",
          },
        ]}
        selectedWorkflowRuleId="workflow-1"
        contentMessage={null}
        workflowName="내부 응답"
        workflowTrigger="복통"
        workflowRetrievalScope="내부 문서"
        workflowModelName="gemini-2.5-flash-lite"
        workflowStatus="active"
        isWorkflowSaving={false}
        isWorkflowRunning={false}
        isWorkflowDeleting={false}
        onSelectWorkflowRule={() => {}}
        onWorkflowNameChange={() => {}}
        onWorkflowTriggerChange={() => {}}
        onWorkflowRetrievalScopeChange={() => {}}
        onWorkflowModelNameChange={() => {}}
        onWorkflowStatusChange={() => {}}
        onSaveWorkflowRule={async () => {}}
        onRunWorkflowRule={async () => {}}
        onDeleteWorkflowRule={async () => {}}
      />,
    );

    await screen.findByText(
      "SCHIFT_API_KEY가 없어 노드 에디터를 열 수 없어요.",
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "노드 에디터" }),
      ).toBeDisabled();
    });

    const workflowButton = screen.getByRole("button", { name: /내부 응답/ });
    expect(workflowButton).toBeDisabled();

    fireEvent.click(workflowButton);

    expect(screen.queryByText("워크플로우 빌더")).not.toBeInTheDocument();
  });

  it("keeps router and sub workflows visible in the list", async () => {
    render(
      <AdminPoliciesSection
        workflowRules={[
          {
            id: "workflow-router",
            name: "모성간호 상담 응답 router",
            trigger: "stage=router",
            retrievalScope: "전체",
            modelName: "gemini-2.5-flash-lite",
            status: "active",
            source: "sql",
            workflowKind: "router",
            storagePath:
              "gs://agaya-workflow-config/maternal-nursing-router.yaml",
          },
          {
            id: "workflow-free",
            name: "free text sub workflow",
            trigger: "free-text",
            retrievalScope: "상담",
            modelName: "gemini-2.5-flash-lite",
            status: "active",
            source: "sql",
            workflowKind: "subworkflow",
            storagePath:
              "gs://agaya-workflow-config/subworkflows/free-chat.yaml",
          },
          {
            id: "workflow-calendar",
            name: "calendar 요약 기록",
            trigger: "calendar",
            retrievalScope: "캘린더",
            modelName: "gemini-2.5-flash-lite",
            status: "review",
            source: "sql",
            workflowKind: "managed",
          },
        ]}
        selectedWorkflowRuleId="workflow-router"
        contentMessage={null}
        workflowName="모성간호 상담 응답 router"
        workflowTrigger="stage=router"
        workflowRetrievalScope="전체"
        workflowModelName="gemini-2.5-flash-lite"
        workflowStatus="active"
        isWorkflowSaving={false}
        isWorkflowRunning={false}
        isWorkflowDeleting={false}
        onSelectWorkflowRule={() => {}}
        onWorkflowNameChange={() => {}}
        onWorkflowTriggerChange={() => {}}
        onWorkflowRetrievalScopeChange={() => {}}
        onWorkflowModelNameChange={() => {}}
        onWorkflowStatusChange={() => {}}
        onSaveWorkflowRule={async () => {}}
        onRunWorkflowRule={async () => {}}
        onDeleteWorkflowRule={async () => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: /모성간호 상담 응답 router/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /free text sub workflow/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /calendar 요약 기록/ }),
    ).toBeInTheDocument();

    const totalSummary = screen
      .getByText("전체 워크플로우")
      .closest("div") as HTMLElement;
    const subSummary = screen
      .getByText("세부 흐름")
      .closest("div") as HTMLElement;

    expect(within(totalSummary).getByText("3")).toBeInTheDocument();
    expect(within(subSummary).getByText("1")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "gs://agaya-workflow-config/subworkflows/free-chat.yaml",
      ),
    ).not.toBeInTheDocument();

    await screen.findByText(
      "SCHIFT_API_KEY가 없어 노드 에디터를 열 수 없어요.",
    );
  });

  it("opens selected YAML workflows in the node editor", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/admin/schift") {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    render(
      <AdminPoliciesSection
        workflowRules={[
          {
            id: "workflow-free",
            name: "free text sub workflow",
            trigger: "free-text",
            retrievalScope: "상담",
            modelName: "gemini-2.5-flash-lite",
            status: "active",
            source: "gcs-yaml",
            workflowKind: "subworkflow",
            sqlSlug: "maternal-nursing-free-chat",
            gcsObject: "subworkflows/free-chat.yaml",
            storagePath:
              "gs://agaya-workflow-config/subworkflows/free-chat.yaml",
          },
        ]}
        selectedWorkflowRuleId="workflow-free"
        contentMessage={null}
        workflowName="free text sub workflow"
        workflowTrigger="free-text"
        workflowRetrievalScope="상담"
        workflowModelName="gemini-2.5-flash-lite"
        workflowStatus="active"
        isWorkflowSaving={false}
        isWorkflowRunning={false}
        isWorkflowDeleting={false}
        onSelectWorkflowRule={() => {}}
        onWorkflowNameChange={() => {}}
        onWorkflowTriggerChange={() => {}}
        onWorkflowRetrievalScopeChange={() => {}}
        onWorkflowModelNameChange={() => {}}
        onWorkflowStatusChange={() => {}}
        onSaveWorkflowRule={async () => {}}
        onRunWorkflowRule={async () => {}}
        onDeleteWorkflowRule={async () => {}}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /free text sub workflow/ }),
    );

    expect(await screen.findByText(/워크플로우 빌더/)).toBeInTheDocument();
  });

  it("does not infer a YAML editor route from the GCS object path alone", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/admin/schift") {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    render(
      <AdminPoliciesSection
        workflowRules={[
          {
            id: "workflow-free",
            name: "free text sub workflow",
            trigger: "free-text",
            retrievalScope: "상담",
            modelName: "gemini-2.5-flash-lite",
            status: "active",
            source: "gcs-yaml",
            workflowKind: "subworkflow",
            gcsObject: "subworkflows/free-chat.yaml",
            storagePath:
              "gs://agaya-workflow-config/subworkflows/free-chat.yaml",
          },
        ]}
        selectedWorkflowRuleId="workflow-free"
        contentMessage={null}
        workflowName="free text sub workflow"
        workflowTrigger="free-text"
        workflowRetrievalScope="상담"
        workflowModelName="gemini-2.5-flash-lite"
        workflowStatus="active"
        isWorkflowSaving={false}
        isWorkflowRunning={false}
        isWorkflowDeleting={false}
        onSelectWorkflowRule={() => {}}
        onWorkflowNameChange={() => {}}
        onWorkflowTriggerChange={() => {}}
        onWorkflowRetrievalScopeChange={() => {}}
        onWorkflowModelNameChange={() => {}}
        onWorkflowStatusChange={() => {}}
        onSaveWorkflowRule={async () => {}}
        onRunWorkflowRule={async () => {}}
        onDeleteWorkflowRule={async () => {}}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /free text sub workflow/ }),
    );

    expect(screen.queryByText(/워크플로우 빌더/)).not.toBeInTheDocument();
  });

  it("opens YAML editor by workflow kind even when the GCS object path is custom", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/admin/schift") {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof fetch;

    render(
      <AdminPoliciesSection
        workflowRules={[
          {
            id: "workflow-monolith",
            name: "runtime YAML",
            trigger: "mobile chat runtime",
            retrievalScope: "상담",
            modelName: "gemini-2.5-flash-lite",
            status: "active",
            source: "gcs-yaml",
            workflowKind: "monolith",
            sqlSlug: "maternal-nursing-monolith",
            storagePath: "gs://agaya-workflow-config/runtime/custom.yaml",
            gcsObject: "runtime/custom.yaml",
          },
        ]}
        selectedWorkflowRuleId="workflow-monolith"
        contentMessage={null}
        workflowName="runtime YAML"
        workflowTrigger="mobile chat runtime"
        workflowRetrievalScope="상담"
        workflowModelName="gemini-2.5-flash-lite"
        workflowStatus="active"
        isWorkflowSaving={false}
        isWorkflowRunning={false}
        isWorkflowDeleting={false}
        onSelectWorkflowRule={() => {}}
        onWorkflowNameChange={() => {}}
        onWorkflowTriggerChange={() => {}}
        onWorkflowRetrievalScopeChange={() => {}}
        onWorkflowModelNameChange={() => {}}
        onWorkflowStatusChange={() => {}}
        onSaveWorkflowRule={async () => {}}
        onRunWorkflowRule={async () => {}}
        onDeleteWorkflowRule={async () => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /runtime YAML/ }));

    expect(
      await screen.findByText("워크플로우 빌더 monolith"),
    ).toBeInTheDocument();
  });
});
