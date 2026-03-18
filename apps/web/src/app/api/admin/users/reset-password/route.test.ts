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

describe("POST /api/admin/users/reset-password", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateAdminServices.mockReset();
  });

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          reason: "운영자 수동 초기화",
        }),
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  test("passes the authenticated admin id to the user port", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    const resetPassword = jest.fn().mockResolvedValue(undefined);
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {
        listUsers: jest.fn(),
        updatePhoneNumber: jest.fn(),
        resetPassword,
      },
      adminContentPort: {} as never,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          reason: "운영자 수동 초기화",
        }),
      }) as never,
    );

    expect(resetPassword).toHaveBeenCalledWith({
      actorId: "admin-1",
      userId: "user-1",
      reason: "운영자 수동 초기화",
    });
    expect(response.status).toBe(200);
  });
});
