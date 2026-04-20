jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/create-admin-services", () => ({
  createAdminServices: jest.fn(),
}));

jest.mock("@/lib/admin/admin-cache", () => ({
  revalidateAdminWorkflowCache: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import { PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedCreateAdminServices = createAdminServices as jest.MockedFunction<
  typeof createAdminServices
>;

describe("PATCH /api/admin/workflow-rules/[ruleId]", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateAdminServices.mockReset();
  });

  test("rejects workflow updates without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/workflow-rules/wf-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "기본 응답",
          trigger: "일반 채팅",
          retrievalScope: "공통 문서",
          modelName: "gemini-2.5-flash-lite",
          status: "active",
        }),
      }),
      {
        params: Promise.resolve({ ruleId: "wf-1" }),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  test("updates a workflow rule for authenticated admins", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    const updateWorkflowRule = jest.fn().mockResolvedValue({
      id: "wf-1",
      name: "기본 응답",
      trigger: "일반 채팅",
      retrievalScope: "공통 문서",
      modelName: "gemini-2.5-flash-lite",
      status: "active",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: {
        createDocument: jest.fn(),
        getDocument: jest.fn(),
        updateDocument: jest.fn(),
        deleteDocument: jest.fn(),
        updateWorkflowRule,
        listKnowledgeItems: jest.fn(),
        createKnowledgeItem: jest.fn(),
        updateKnowledgeItem: jest.fn(),
        deleteKnowledgeItem: jest.fn(),
        listWeeks: jest.fn(),
        getWeek: jest.fn(),
        saveWeek: jest.fn(),
      },
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/workflow-rules/wf-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "기본 응답",
          trigger: "일반 채팅",
          retrievalScope: "공통 문서",
          modelName: "gemini-2.5-flash-lite",
          status: "active",
        }),
      }),
      {
        params: Promise.resolve({ ruleId: "wf-1" }),
      },
    );

    expect(updateWorkflowRule).toHaveBeenCalledWith(
      "wf-1",
      {
        name: "기본 응답",
        trigger: "일반 채팅",
        retrievalScope: "공통 문서",
        modelName: "gemini-2.5-flash-lite",
        status: "active",
      },
      "admin-1",
    );
    expect(response.status).toBe(200);
  });
});
