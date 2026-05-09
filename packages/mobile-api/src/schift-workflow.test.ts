import {
  clearSchiftWorkflowOutputBlockCacheForTests,
  extractSchiftWorkflowOutputs,
  resolveSchiftWorkflowId,
  runSchiftWorkflow,
} from "./schift-workflow";

jest.mock("./schift-workflows-api", () => ({
  listSchiftWorkflows: jest.fn(),
}));

import { listSchiftWorkflows } from "./schift-workflows-api";

const mockedListSchiftWorkflows = listSchiftWorkflows as jest.MockedFunction<
  typeof listSchiftWorkflows
>;

describe("resolveSchiftWorkflowId", () => {
  beforeEach(() => {
    mockedListSchiftWorkflows.mockReset();
  });

  it("prefers the canonical internal-data-answer workflow when multiple Schift workflows are runnable", async () => {
    mockedListSchiftWorkflows.mockResolvedValue([
      {
        id: "wf-other-active",
        name: "내부 데이터 응답",
        status: "published",
        graph: { blocks: [{ id: "start" }], edges: [] },
      },
      {
        id: "wf-canonical",
        name: "모성간호 상담 응답",
        status: "published",
        description:
          '<!-- si-admin-workflow:{"trigger":"내부 데이터만 답변","retrievalScope":"pregnancy-knowledge 내부 자료","modelName":"gemini-2.5-flash-lite"}-->\n기본 설명',
        graph: { blocks: [{ id: "start" }], edges: [] },
      },
      {
        id: "wf-archived-duplicate",
        name: "모성간호 상담 응답",
        status: "archived",
        description:
          '<!-- si-admin-workflow:{"trigger":"내부 데이터만 답변","retrievalScope":"pregnancy-knowledge 내부 자료","modelName":"gemini-2.5-flash-lite"}-->\n기본 설명',
        graph: { blocks: [{ id: "start" }], edges: [] },
      },
    ] as never);

    const workflowId = await resolveSchiftWorkflowId({} as never);

    expect(workflowId).toBe("wf-canonical");
  });
});

describe("runSchiftWorkflow", () => {
  beforeEach(() => {
    mockedListSchiftWorkflows.mockReset();
    clearSchiftWorkflowOutputBlockCacheForTests();
    jest.restoreAllMocks();
  });

  it("requires an explicit workflow id", async () => {
    await expect(
      runSchiftWorkflow({
        schift: { workflows: {} },
        inputs: { query: "안녕하세요" },
      } as never),
    ).rejects.toThrow("Schift workflow ID is required");

    expect(mockedListSchiftWorkflows).not.toHaveBeenCalled();
  });

  it("does not retry another workflow when the requested workflow is missing", async () => {
    const get = jest.fn().mockRejectedValue(new Error("404 not found"));

    await expect(
      runSchiftWorkflow({
        schift: { workflows: { get } },
        workflowId: "wf-missing",
        inputs: { query: "안녕하세요" },
      } as never),
    ).rejects.toThrow("404 not found");

    expect(get).toHaveBeenCalledWith("wf-missing");
    expect(mockedListSchiftWorkflows).not.toHaveBeenCalled();
  });

  it("reuses the workflow output block after metadata has been loaded once", async () => {
    const get = jest.fn().mockResolvedValue({
      id: "wf-cache",
      graph: {
        blocks: [
          { id: "start", type: "input" },
          { id: "json-answer", type: "answer", title: "JSON 응답" },
        ],
      },
    });
    const run = jest.fn();
    const fetch = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "completed", outputs: { result: "ok" } }),
    } as Response);

    await runSchiftWorkflow({
      schift: { workflows: { get, run } },
      workflowId: "wf-cache",
      inputs: { query: "첫 답변" },
    } as never);
    await runSchiftWorkflow({
      schift: { workflows: { get, run } },
      workflowId: "wf-cache",
      inputs: { query: "두 번째 답변" },
    } as never);

    expect(get).toHaveBeenCalledTimes(1);
    expect(run).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      inputs: { query: "첫 답변" },
      output: "json-answer",
    });
  });
});

describe("extractSchiftWorkflowOutputs", () => {
  it("ignores empty Schift answer payloads and uses the LLM text block", () => {
    const outputs = extractSchiftWorkflowOutputs({
      outputs: {
        result: {
          answer: '{"text":"","sources":[]}',
          sources: [],
          format: "json",
        },
      },
      block_states: {
        start: {
          outputs: { query: "오늘은 마음이 불안해요." },
        },
        answer: {
          outputs: {
            answer: '{"text":"","sources":[]}',
            sources: [],
          },
        },
        llm: {
          outputs: {
            text: JSON.stringify({
              answer: "그렇게 느낄 수 있어요.",
              characterTone: "anxious",
              quickReplies: [
                { label: "아기 소식 볼래요", message: "아기 소식 볼래요." },
              ],
            }),
          },
        },
      },
    });

    expect(outputs).toEqual(
      expect.objectContaining({
        text: expect.stringContaining("그렇게 느낄 수 있어요"),
      }),
    );
  });
});
