import {
  extractSchiftWorkflowOutputs,
  resolveSchiftWorkflowId,
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

describe("extractSchiftWorkflowOutputs", () => {
  it("ignores empty Schift answer payloads and uses the LLM text block", () => {
    const outputs = extractSchiftWorkflowOutputs({
      outputs: {
        result: {
          answer: "{\"text\":\"\",\"sources\":[]}",
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
            answer: "{\"text\":\"\",\"sources\":[]}",
            sources: [],
          },
        },
        llm: {
          outputs: {
            text: JSON.stringify({
              answer: "그렇게 느낄 수 있어요.",
              characterTone: "anxious",
              quickReplies: [{ label: "아기 소식 볼래요", message: "아기 소식 볼래요." }],
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
