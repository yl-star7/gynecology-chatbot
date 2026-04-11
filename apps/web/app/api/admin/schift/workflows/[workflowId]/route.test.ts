jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/mobile/schift-client", () => ({
  getSchiftClient: jest.fn(),
}));

jest.mock("@/lib/mobile/schift-workflows-api", () => ({
  patchSchiftWorkflow: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { patchSchiftWorkflow } from "@/lib/mobile/schift-workflows-api";
import { GET, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedGetSchiftClient = getSchiftClient as jest.MockedFunction<
  typeof getSchiftClient
>;
const mockedPatchSchiftWorkflow = patchSchiftWorkflow as jest.MockedFunction<
  typeof patchSchiftWorkflow
>;

describe("/api/admin/schift/workflows/[workflowId]", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedGetSchiftClient.mockReset();
    mockedPatchSchiftWorkflow.mockReset();
  });

  test("prefers non-empty blocks when nodes is empty", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedGetSchiftClient.mockReturnValue({
      workflows: {
        get: jest.fn().mockResolvedValue({
          id: "wf-1",
          name: "모성간호 상담 응답",
          graph: {
            nodes: [],
            blocks: [{ id: "start", type: "start" }],
            edges: [],
          },
        }),
      },
    } as never);

    const response = await GET(
      new Request(
        "http://localhost:3000/api/admin/schift/workflows/wf-1",
      ) as never,
      { params: Promise.resolve({ workflowId: "wf-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        graph: expect.objectContaining({
          blocks: [{ id: "start", type: "start" }],
          nodes: [{ id: "start", type: "start" }],
          edges: [],
        }),
      }),
    );
  });

  test("reconstructs blocks from edges when both nodes and blocks are empty", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedGetSchiftClient.mockReturnValue({
      workflows: {
        get: jest.fn().mockResolvedValue({
          id: "wf-1",
          name: "모성간호 상담 응답",
          graph: {
            nodes: [],
            blocks: [],
            edges: [{ id: "e1", source: "start", target: "end" }],
          },
        }),
      },
    } as never);

    const response = await GET(
      new Request(
        "http://localhost:3000/api/admin/schift/workflows/wf-1",
      ) as never,
      { params: Promise.resolve({ workflowId: "wf-1" }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.graph.blocks).toEqual([
      expect.objectContaining({
        id: "start",
        type: "start",
        title: "사용자 질문 입력",
      }),
      expect.objectContaining({ id: "end", type: "end", title: "종료" }),
    ]);
    expect(body.graph.nodes).toEqual(body.graph.blocks);
  });

  test("applies graph patch via addBlock/addEdge and normalizes response", async () => {
    const addBlockMock = jest.fn(
      async (_wfId: string, block: { type: string; title: string }) => ({
        id: `new-${block.type}`,
        type: block.type,
      }),
    );
    const addEdgeMock = jest.fn(async () => ({ id: "e-new" }));
    const removeBlockMock = jest.fn(async () => undefined);

    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedPatchSchiftWorkflow.mockResolvedValue({
      id: "wf-1",
      name: "새 이름",
    } as never);
    mockedGetSchiftClient.mockReturnValue({
      workflows: {
        get: jest.fn().mockResolvedValue({
          id: "wf-1",
          name: "새 이름",
          graph: {
            nodes: [{ id: "new-start", type: "start", config: {} }],
            blocks: [],
            edges: [],
          },
        }),
        addBlock: addBlockMock,
        addEdge: addEdgeMock,
        removeBlock: removeBlockMock,
      },
    } as never);

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/schift/workflows/wf-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "새 이름",
          graph: {
            blocks: [
              { id: "start", type: "start", title: "Start", config: {} },
            ],
            edges: [],
          },
        }),
      }) as never,
      { params: Promise.resolve({ workflowId: "wf-1" }) },
    );

    expect(mockedPatchSchiftWorkflow).toHaveBeenCalledWith("wf-1", {
      name: "새 이름",
    });
    expect(addBlockMock).toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        graph: expect.objectContaining({
          nodes: [{ id: "new-start", type: "start", config: {} }],
        }),
      }),
    );
  });
});
