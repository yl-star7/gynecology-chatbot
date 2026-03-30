jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/create-admin-services", () => ({
  createAdminServices: jest.fn(),
}));

jest.mock("@/lib/admin/admin-cache", () => ({
  revalidateAdminDocumentsCache: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import { DELETE, GET, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedCreateAdminServices = createAdminServices as jest.MockedFunction<
  typeof createAdminServices
>;

describe("/api/admin/rag/documents/[documentId]", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateAdminServices.mockReset();
  });

  test("rejects document detail requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await GET({} as Request, {
      params: Promise.resolve({ documentId: "doc-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  test("returns a document detail for authenticated admins", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: {
        createDocument: jest.fn(),
        getDocument: jest.fn().mockResolvedValue({
          id: "doc-1",
          title: "두통 가이드",
          pregnancyWeekLabel: "18주차",
          pregnancyWeek: 18,
          category: "guide",
          chunkCount: 1,
          updatedAt: "2026-03-18T10:00:00.000Z",
          status: "ready",
          content: "본문",
        }),
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

    const response = await GET({} as Request, {
      params: Promise.resolve({ documentId: "doc-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      document: expect.objectContaining({
        id: "doc-1",
        title: "두통 가이드",
      }),
    });
  });

  test("updates a document for authenticated admins", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    const updateDocument = jest.fn().mockResolvedValue({
      id: "doc-1",
      title: "수정된 두통 가이드",
      pregnancyWeekLabel: "공통",
      pregnancyWeek: null,
      category: "warning",
      chunkCount: 1,
      updatedAt: "2026-03-18T10:00:00.000Z",
      status: "ready",
      content: "수정 본문",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: {
        createDocument: jest.fn(),
        getDocument: jest.fn(),
        updateDocument,
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

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/rag/documents/doc-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "수정된 두통 가이드",
          pregnancyWeek: null,
          category: "warning",
          content: "수정 본문",
        }),
      }),
      {
        params: Promise.resolve({ documentId: "doc-1" }),
      },
    );

    expect(updateDocument).toHaveBeenCalledWith(
      "doc-1",
      {
        title: "수정된 두통 가이드",
        pregnancyWeek: null,
        category: "warning",
        content: "수정 본문",
        imageUrl: null,
      },
      "admin-1",
    );
    expect(response.status).toBe(200);
  });

  test("deletes a document for authenticated admins", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    const deleteDocument = jest.fn().mockResolvedValue(undefined);
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: {
        createDocument: jest.fn(),
        getDocument: jest.fn(),
        updateDocument: jest.fn(),
        deleteDocument,
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

    const response = await DELETE({} as Request, {
      params: Promise.resolve({ documentId: "doc-1" }),
    });

    expect(deleteDocument).toHaveBeenCalledWith("doc-1", "admin-1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
