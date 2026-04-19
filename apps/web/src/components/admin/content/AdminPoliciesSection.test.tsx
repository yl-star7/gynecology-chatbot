import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminPoliciesSection } from "./AdminPoliciesSection";

jest.mock("@schift-io/sdk/workflow-editor", () => ({
  WorkflowEditorProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  WorkflowBuilder: () => <div>워크플로우 빌더</div>,
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
            modelName: "gemini-3.1-flash-lite-preview",
            status: "active",
          },
        ]}
        selectedWorkflowRuleId="workflow-1"
        contentMessage={null}
        workflowName="내부 응답"
        workflowTrigger="복통"
        workflowRetrievalScope="내부 문서"
        workflowModelName="gemini-3.1-flash-lite-preview"
        workflowStatus="active"
        isWorkflowSaving={false}
        isWorkflowBootstrapping={false}
        isWorkflowRunning={false}
        isWorkflowDeleting={false}
        onSelectWorkflowRule={() => {}}
        onWorkflowNameChange={() => {}}
        onWorkflowTriggerChange={() => {}}
        onWorkflowRetrievalScopeChange={() => {}}
        onWorkflowModelNameChange={() => {}}
        onWorkflowStatusChange={() => {}}
        onSaveWorkflowRule={async () => {}}
        onBootstrapWorkflowRule={async () => {}}
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
});
