jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/create-admin-services", () => ({
  createAdminServices: jest.fn(),
}));

jest.mock("@/lib/admin/admin-cache", () => ({
  loadCachedAdminWeekDetail: jest.fn(),
  revalidateAdminWeeksCache: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import {
  loadCachedAdminWeekDetail,
  revalidateAdminWeeksCache,
} from "@/lib/admin/admin-cache";
import { GET, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedCreateAdminServices = createAdminServices as jest.MockedFunction<
  typeof createAdminServices
>;
const mockedLoadCachedAdminWeekDetail =
  loadCachedAdminWeekDetail as jest.MockedFunction<
    typeof loadCachedAdminWeekDetail
  >;
const mockedRevalidateAdminWeeksCache =
  revalidateAdminWeeksCache as jest.MockedFunction<
    typeof revalidateAdminWeeksCache
  >;

function createAdminContentPortStub(
  overrides: Partial<
    ReturnType<typeof createAdminServices>["adminContentPort"]
  >,
) {
  return {
    createDocument: jest.fn(),
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
    ...overrides,
  };
}

describe("GET /api/admin/content/weeks/[weekNumber]", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateAdminServices.mockReset();
    mockedLoadCachedAdminWeekDetail.mockReset();
    mockedRevalidateAdminWeeksCache.mockReset();
  });

  test("returns 404 when the week does not exist", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedLoadCachedAdminWeekDetail.mockResolvedValue(null);

    const response = await GET({} as Request, {
      params: Promise.resolve({ weekNumber: "7" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "week not found" });
  });

  test("updates a week for authenticated admins", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    const getWeek = jest.fn().mockResolvedValue({
      id: "week-7",
      weekNumber: 7,
      title: "7주차 기본",
      babySizeLabel: "블루베리",
      babySizeCompareObject: "큰 블루베리",
      babySummary: "기존 아기 요약",
      motherSummary: "기존 엄마 요약",
      heroImagePath: "/hero.jpg",
      compareImagePath: "/compare.jpg",
      status: "published",
      updatedAt: "2026-03-18T00:00:00.000Z",
      days: [],
      sections: [],
      assets: [],
      media: [],
    });
    const saveWeek = jest.fn().mockResolvedValue({
      id: "week-7",
      weekNumber: 7,
      title: "7주차 수정본",
      babySizeLabel: "블루베리",
      babySizeCompareObject: "큰 블루베리",
      babySummary: "수정된 아기 요약",
      motherSummary: "수정된 엄마 요약",
      heroImagePath: "/hero.jpg",
      compareImagePath: "/compare.jpg",
      status: "published",
      updatedAt: "2026-03-18T00:00:00.000Z",
      days: [],
      sections: [],
      assets: [],
      media: [],
    });
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: createAdminContentPortStub({
        getWeek,
        saveWeek,
      }),
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/content/weeks/7", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "7주차 수정본",
          babySizeLabel: "블루베리",
          babySizeCompareObject: "큰 블루베리",
          babySummary: "수정된 아기 요약",
          motherSummary: "수정된 엄마 요약",
          heroImagePath: "/hero.jpg",
          compareImagePath: "/compare.jpg",
          status: "published",
          days: [],
          sections: [],
          assets: [],
          media: [],
        }),
      }),
      {
        params: Promise.resolve({ weekNumber: "7" }),
      },
    );

    expect(saveWeek).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        title: "7주차 수정본",
        status: "published",
      }),
      "admin-1",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      week: expect.objectContaining({
        weekNumber: 7,
        title: "7주차 수정본",
      }),
    });
    expect(mockedRevalidateAdminWeeksCache).toHaveBeenCalledWith(7);
  });

  test("rejects an empty title", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: createAdminContentPortStub({}),
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/content/weeks/7", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "   ",
          babySizeLabel: "블루베리",
          babySizeCompareObject: "큰 블루베리",
          babySummary: "수정된 아기 요약",
          motherSummary: "수정된 엄마 요약",
          heroImagePath: "/hero.jpg",
          compareImagePath: "/compare.jpg",
          status: "published",
          days: [],
          sections: [],
          assets: [],
          media: [],
        }),
      }),
      {
        params: Promise.resolve({ weekNumber: "7" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid week payload",
    });
  });

  test("rejects duplicate section keys", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: createAdminContentPortStub({}),
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/content/weeks/7", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "7주차 수정본",
          babySizeLabel: "블루베리",
          babySizeCompareObject: "큰 블루베리",
          babySummary: "수정된 아기 요약",
          motherSummary: "수정된 엄마 요약",
          heroImagePath: "/hero.jpg",
          compareImagePath: "/compare.jpg",
          status: "published",
          days: [],
          sections: [
            {
              dayNumber: 1,
              sectionKey: "baby_growth",
              title: "아기 성장",
              body: "첫 섹션",
              displayOrder: 1,
              isRequired: true,
              isActive: true,
            },
            {
              dayNumber: 1,
              sectionKey: "baby_growth",
              title: "아기 성장 2",
              body: "중복 섹션",
              displayOrder: 2,
              isRequired: false,
              isActive: true,
            },
          ],
          assets: [],
          media: [],
        }),
      }),
      {
        params: Promise.resolve({ weekNumber: "7" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid week payload",
    });
  });

  test("rejects blank section fields when sections are present", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: createAdminContentPortStub({}),
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/content/weeks/7", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "7주차 수정본",
          babySizeLabel: "블루베리",
          babySizeCompareObject: "큰 블루베리",
          babySummary: "수정된 아기 요약",
          motherSummary: "수정된 엄마 요약",
          heroImagePath: "/hero.jpg",
          compareImagePath: "/compare.jpg",
          status: "published",
          days: [],
          sections: [
            {
              dayNumber: 1,
              sectionKey: "baby_growth",
              title: "  ",
              body: "섹션 본문",
              displayOrder: 1,
              isRequired: true,
              isActive: true,
            },
          ],
          assets: [],
          media: [],
        }),
      }),
      {
        params: Promise.resolve({ weekNumber: "7" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid week payload",
    });
  });

  test("rejects blank asset fields when assets are present", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: createAdminContentPortStub({}),
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/content/weeks/7", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "7주차 수정본",
          babySizeLabel: "블루베리",
          babySizeCompareObject: "큰 블루베리",
          babySummary: "수정된 아기 요약",
          motherSummary: "수정된 엄마 요약",
          heroImagePath: "/hero.jpg",
          compareImagePath: "/compare.jpg",
          status: "published",
          days: [],
          sections: [],
          assets: [
            {
              dayNumber: 1,
              assetType: "  ",
              storagePath: "/assets/week7/hero.jpg",
              altText: "히어로",
              styleKey: "hero",
              displayOrder: 1,
              isRequired: false,
              isActive: true,
            },
          ],
          media: [],
        }),
      }),
      {
        params: Promise.resolve({ weekNumber: "7" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid week payload",
    });
  });

  test("rejects invalid status values", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {} as never,
      adminContentPort: createAdminContentPortStub({}),
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/content/weeks/7", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "7주차 수정본",
          babySizeLabel: "블루베리",
          babySizeCompareObject: "큰 블루베리",
          babySummary: "수정된 아기 요약",
          motherSummary: "수정된 엄마 요약",
          heroImagePath: "/hero.jpg",
          compareImagePath: "/compare.jpg",
          status: "deleted",
          days: [],
          sections: [],
          assets: [],
          media: [],
        }),
      }),
      {
        params: Promise.resolve({ weekNumber: "7" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid week payload",
    });
  });
});
