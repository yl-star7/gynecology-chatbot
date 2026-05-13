import { getWorkflowYamlEditorRouteName } from "./workflow-yaml-route";

describe("workflow-yaml-route", () => {
  it("uses the workflow_definition slug as the editor route", () => {
    expect(
      getWorkflowYamlEditorRouteName({
        id: "workflow-free-chat",
        name: "free chat",
        trigger: "stage=free_chat",
        retrievalScope: "상담",
        modelName: "gemini-3.1-flash-lite",
        status: "active",
        sqlSlug: "maternal-nursing-free-chat",
        workflowKind: "subworkflow",
        storagePath: "gs://agaya-workflow-config/runtime/custom.yaml",
      }),
    ).toBe("free-chat");
  });

  it("keeps monolith and router editable by kind for legacy rows", () => {
    expect(
      getWorkflowYamlEditorRouteName({
        id: "workflow-monolith",
        name: "runtime",
        trigger: "mobile chat runtime",
        retrievalScope: "상담",
        modelName: "gemini-3.1-flash-lite",
        status: "active",
        workflowKind: "monolith",
        storagePath: "gs://agaya-workflow-config/runtime/custom.yaml",
      }),
    ).toBe("monolith");

    expect(
      getWorkflowYamlEditorRouteName({
        id: "workflow-router",
        name: "router",
        trigger: "stage router",
        retrievalScope: "상담",
        modelName: "gemini-3.1-flash-lite",
        status: "active",
        workflowKind: "router",
        storagePath: "gs://agaya-workflow-config/runtime/custom.yaml",
      }),
    ).toBe("router");
  });

  it("does not infer a route from the GCS object path", () => {
    expect(
      getWorkflowYamlEditorRouteName({
        id: "workflow-free-chat",
        name: "free chat",
        trigger: "stage=free_chat",
        retrievalScope: "상담",
        modelName: "gemini-3.1-flash-lite",
        status: "active",
        workflowKind: "subworkflow",
        gcsObject: "subworkflows/free-chat.yaml",
        storagePath: "gs://agaya-workflow-config/subworkflows/free-chat.yaml",
      }),
    ).toBeNull();
  });
});
