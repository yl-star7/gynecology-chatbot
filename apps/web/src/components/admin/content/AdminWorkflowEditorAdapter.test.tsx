import { render, screen, waitFor } from "@testing-library/react";
import { BLOCK_TYPES } from "@schift-io/sdk/workflow-editor";

import { AdminWorkflowEditorAdapter } from "./AdminWorkflowEditorAdapter";

jest.mock("@schift-io/sdk/workflow-editor", () => {
  const blockTypes: Array<Record<string, unknown>> = [];

  return {
    BLOCK_TYPES: blockTypes,
    WorkflowEditorProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="workflow-provider">{children}</div>
    ),
    WorkflowBuilder: ({
      initialWorkflowId,
    }: {
      initialWorkflowId?: string | null;
    }) => (
      <div>
        <button>← Back</button>
        <button>Validate</button>
        <button>Save</button>
        <button>&blacktriangleright; Run</button>
        <span>6 blocks · 5 edges</span>
        <p>Pick a block to configure it</p>
        <p>Quick guide</p>
        <svg>
          <text>YAML 전역 설정</text>
          <text>workflow_settings</text>
        </svg>
        <input
          aria-label="Search blocks"
          placeholder="Search... (e.g. router, dedupe, http)"
        />
        <div>빌더 {initialWorkflowId}</div>
      </div>
    ),
  };
});

describe("AdminWorkflowEditorAdapter", () => {
  it("registers the YAML settings block for canvas rendering", () => {
    const blockTypes = BLOCK_TYPES as unknown as Array<Record<string, unknown>>;
    const settingsBlocks = blockTypes.filter(
      (block) => block.type === "workflow_settings",
    );

    expect(settingsBlocks).toHaveLength(1);
    expect(settingsBlocks[0]).toEqual(
      expect.objectContaining({
        label: "전역 설정",
        icon: "설",
        inputs: [],
        outputs: [],
      }),
    );
  });

  it("localizes the embedded editor chrome", async () => {
    render(
      <AdminWorkflowEditorAdapter workflowId="aby-info" onBack={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "검사" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "← 목록" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "실행" })).toBeInTheDocument();
    expect(screen.getByText("6개 블록 · 5개 연결")).toBeInTheDocument();
    expect(
      screen.getByText("블록을 선택하면 설정이 열립니다"),
    ).toBeInTheDocument();
    expect(screen.getByText("빠른 안내")).toBeInTheDocument();
    expect(screen.getByText("전역 설정")).toBeInTheDocument();
    expect(screen.getByText("워크플로우 설정")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("블록 검색")).toBeInTheDocument();
    expect(screen.getByLabelText("블록 검색")).toBeInTheDocument();
    expect(screen.getByText("빌더 aby-info")).toBeInTheDocument();
  });

  it("keeps the integrated conversation view out of the raw workflow editor", () => {
    render(
      <AdminWorkflowEditorAdapter workflowId="aby-info" onBack={() => {}} />,
    );

    expect(screen.queryByText("대화/근거 미리보기")).not.toBeInTheDocument();
    expect(screen.queryByText("앱 대화 흐름")).not.toBeInTheDocument();
  });
});
