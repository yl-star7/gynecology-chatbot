jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      { status: 500 },
    ),
  ),
}));

jest.mock("@/lib/admin/admin-cache", () => ({
  loadCachedAdminKnowledgeItems: jest.fn(),
}));

jest.mock("@gynecology-chatbot/db/prisma", () => ({
  prisma: {
    content_pregnancy_documents: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import { prisma } from "@gynecology-chatbot/db/prisma";
import { loadCachedAdminKnowledgeItems } from "@/lib/admin/admin-cache";
import { requireMobileSession } from "@/lib/mobile/session-auth";
import { GET } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedLoadCachedAdminKnowledgeItems =
  loadCachedAdminKnowledgeItems as jest.MockedFunction<
    typeof loadCachedAdminKnowledgeItems
  >;
const mockedPregnancyDocuments = prisma.content_pregnancy_documents as unknown as {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
};

describe("GET /api/mobile/link", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockResolvedValue({ userId: "user-1" } as never);
    mockedLoadCachedAdminKnowledgeItems.mockReset();
    mockedPregnancyDocuments.findUnique.mockReset();
    mockedPregnancyDocuments.findFirst.mockReset();
  });

  it("returns a pregnancy document fallback when no knowledge item is published", async () => {
    mockedLoadCachedAdminKnowledgeItems.mockResolvedValue([] as never);
    mockedPregnancyDocuments.findFirst.mockResolvedValue({
      id: "doc-1",
      title: "24주차 배뭉침 안내",
      content: "쉬면 나아지는지 살펴보고 반복되면 진료를 받아보세요.",
      category: "symptom-guide",
      pregnancy_week: 24,
    });

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/link?target=knowledge"),
    } as never);

    await expect(response.json()).resolves.toEqual({
      content: {
        title: "24주차 배뭉침 안내",
        section: "24주 정보",
        body: "쉬면 나아지는지 살펴보고 반복되면 진료를 받아보세요.",
      },
    });
    expect(response.status).toBe(200);
  });

  it("rejects synthetic week ids instead of treating them as real entity ids", async () => {
    mockedLoadCachedAdminKnowledgeItems.mockResolvedValue([] as never);

    const response = await GET({
      nextUrl: new URL(
        "http://localhost:3000/api/mobile/link?target=knowledge&entityId=week-25",
      ),
    } as never);

    expect(response.status).toBe(404);
    expect(mockedPregnancyDocuments.findUnique).not.toHaveBeenCalled();
    expect(mockedPregnancyDocuments.findFirst).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "link target not found",
    });
  });

  it("opens pregnancy document fallback by its real UUID entity id", async () => {
    mockedLoadCachedAdminKnowledgeItems.mockResolvedValue([] as never);
    mockedPregnancyDocuments.findUnique.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440025",
      title: "25주차 안내",
      content: "25주차에 맞는 정보를 읽어봐요.",
      category: "week-guide",
      pregnancy_week: 25,
    });

    const response = await GET({
      nextUrl: new URL(
        "http://localhost:3000/api/mobile/link?target=knowledge&entityId=550e8400-e29b-41d4-a716-446655440025",
      ),
    } as never);

    expect(response.status).toBe(200);
    expect(mockedPregnancyDocuments.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "550e8400-e29b-41d4-a716-446655440025" },
      }),
    );
    await expect(response.json()).resolves.toEqual({
      content: {
        title: "25주차 안내",
        section: "25주 정보",
        body: "25주차에 맞는 정보를 읽어봐요.",
      },
    });
  });

  it("keeps published knowledge items ahead of fallback documents", async () => {
    mockedLoadCachedAdminKnowledgeItems.mockResolvedValue([
      {
        id: "knowledge-1",
        slug: "nutrition",
        section: "knowledge",
        title: "영양 안내",
        body: "오늘 먹은 음식과 수분 섭취를 살펴봐요.",
        status: "published",
      },
    ] as never);

    const response = await GET({
      nextUrl: new URL("http://localhost:3000/api/mobile/link?target=knowledge"),
    } as never);

    expect(response.status).toBe(200);
    expect(mockedPregnancyDocuments.findFirst).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      content: {
        title: "영양 안내",
        section: "knowledge",
        body: "오늘 먹은 음식과 수분 섭취를 살펴봐요.",
      },
    });
  });
});
