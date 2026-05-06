jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/mobile/schift-workflows-api", () => ({
  listSchiftWorkflows: jest.fn(),
}));

jest.mock("@/lib/mobile/workflows/load-workflow-yaml", () => ({
  loadMaternalNursingWorkflow: jest.fn(),
  refreshWorkflowFromStorage: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { listSchiftWorkflows } from "@/lib/mobile/schift-workflows-api";
import {
  loadMaternalNursingWorkflow,
  refreshWorkflowFromStorage,
} from "@/lib/mobile/workflows/load-workflow-yaml";
import { GET } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedListSchiftWorkflows = listSchiftWorkflows as jest.MockedFunction<
  typeof listSchiftWorkflows
>;
const mockedLoadMaternalNursingWorkflow =
  loadMaternalNursingWorkflow as jest.MockedFunction<
    typeof loadMaternalNursingWorkflow
  >;
const mockedRefreshWorkflowFromStorage =
  refreshWorkflowFromStorage as jest.MockedFunction<
    typeof refreshWorkflowFromStorage
  >;

describe("/api/admin/schift/workflows", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedListSchiftWorkflows.mockReset();
    mockedLoadMaternalNursingWorkflow.mockReset();
    mockedRefreshWorkflowFromStorage.mockReset();
  });

  test("returns the current workflow YAML when Schift listing is unavailable", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedListSchiftWorkflows.mockRejectedValue(
      new Error("Schift unavailable"),
    );
    mockedRefreshWorkflowFromStorage.mockResolvedValue(null);
    mockedLoadMaternalNursingWorkflow.mockReturnValue({
      version: 1,
      name: "모성간호 상담 응답",
      description: "현재 적용된 상담 워크플로우",
      source: "local",
      storageBucket: null,
      storagePath: "workflows/maternal-nursing.yaml",
      localPath: "/tmp/maternal-nursing.yaml",
      loadedAt: "2026-05-06T00:00:00.000Z",
      graph: {
        blocks: [
          {
            id: "start",
            type: "start",
            title: "사용자 질문 입력",
            position: { x: 100, y: 100 },
            config: {},
          },
        ],
        nodes: [
          {
            id: "start",
            type: "start",
            title: "사용자 질문 입력",
            position: { x: 100, y: 100 },
            config: {},
          },
        ],
        edges: [],
      },
      adminMetadata: {
        trigger: "내부 데이터만 답변",
        retrieval_scope: "maternal-nursing",
        model_name: "gemini-2.5-flash-lite",
      },
      prompts: {},
      staticResponses: {},
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: "maternal-nursing-current",
        name: "모성간호 상담 응답",
        description: "현재 적용된 상담 워크플로우",
        status: "active",
        graph: expect.objectContaining({
          blocks: [
            expect.objectContaining({ id: "start", type: "start", config: {} }),
          ],
          nodes: [
            expect.objectContaining({ id: "start", type: "start", config: {} }),
          ],
          edges: [],
        }),
      }),
    ]);
  });
});
