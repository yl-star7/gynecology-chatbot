jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/create-admin-services", () => ({
  createAdminServices: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import { GET } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedCreateAdminServices = createAdminServices as jest.MockedFunction<
  typeof createAdminServices
>;

describe("GET /api/admin/content/weeks", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateAdminServices.mockReset();
  });

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  test("returns week summaries for authenticated admins", async () => {
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
        listWeeks: jest.fn().mockResolvedValue([
          {
            id: "week-1",
            weekNumber: 1,
            title: "1주차",
            babySizeLabel: null,
            babySizeCompareObject: null,
            babySummary: null,
            motherSummary: null,
            heroImagePath: null,
            compareImagePath: null,
            status: "draft",
            updatedAt: "2026-03-17T00:00:00.000Z",
          },
        ]),
        getWeek: jest.fn(),
        saveWeek: jest.fn(),
      },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      weeks: [
        {
          id: "week-1",
          weekNumber: 1,
          title: "1주차",
          babySizeLabel: null,
          babySizeCompareObject: null,
          babySummary: null,
          motherSummary: null,
          heroImagePath: null,
          compareImagePath: null,
          status: "draft",
          updatedAt: "2026-03-17T00:00:00.000Z",
        },
      ],
    });
  });
});
