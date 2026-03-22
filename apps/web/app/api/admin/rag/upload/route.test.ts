jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/create-admin-services", () => ({
  createAdminServices: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import { POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedCreateAdminServices = createAdminServices as jest.MockedFunction<
  typeof createAdminServices
>;

describe("POST /api/admin/rag/upload", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateAdminServices.mockReset();
  });

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/rag/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "문서",
          content: "본문",
          category: "guide",
        }),
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  test("creates a document through the admin content port", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    const createDocument = jest.fn().mockResolvedValue({
      id: "doc-1",
      title: "문서",
      pregnancyWeekLabel: "공통",
      pregnancyWeek: null,
      category: "guide",
      chunkCount: 1,
      updatedAt: "2026-03-18T00:00:00.000Z",
      status: "ready",
      content: "본문",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: {
        createDocument,
        getDocument: jest.fn(),
        updateDocument: jest.fn(),
        deleteDocument: jest.fn(),
        updateWorkflowRule: jest.fn(),
        listKnowledgeItems: jest.fn(),
        createKnowledgeItem: jest.fn(),
        updateKnowledgeItem: jest.fn(),
        deleteKnowledgeItem: jest.fn(),
        listWeeks: jest.fn(),
        getWeek: jest.fn(),
        saveWeek: jest.fn(),
      },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/admin/rag/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "문서",
          content: "본문",
          category: "guide",
          pregnancyWeek: null,
        }),
      }) as never,
    );

    expect(createDocument).toHaveBeenCalledWith({
      title: "문서",
      content: "본문",
      category: "guide",
      pregnancyWeek: null,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: "doc-1", ok: true });
  });
});
