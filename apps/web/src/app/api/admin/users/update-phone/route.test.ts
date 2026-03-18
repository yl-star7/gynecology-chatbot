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

describe("POST /api/admin/users/update-phone", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateAdminServices.mockReset();
  });

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/update-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          phoneNumber: "01099998888",
          reason: "운영자 요청",
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
    const updatePhoneNumber = jest.fn().mockResolvedValue(undefined);
    mockedCreateAdminServices.mockReturnValue({
      adminDashboardPort: {} as never,
      adminUserPort: {
        listUsers: jest.fn(),
        listAllowedPhoneNumbers: jest.fn(),
        updatePhoneNumber,
        createAllowedPhoneNumber: jest.fn(),
        updateAllowedPhoneNumber: jest.fn(),
        deleteAllowedPhoneNumber: jest.fn(),
        resetSession: jest.fn(),
      },
      adminContentPort: {} as never,
    });

    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/update-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          phoneNumber: "01099998888",
          reason: "운영자 요청",
        }),
      }) as never,
    );

    expect(updatePhoneNumber).toHaveBeenCalledWith({
      actorId: "admin-1",
      userId: "user-1",
      phoneNumber: "01099998888",
      reason: "운영자 요청",
    });
    expect(response.status).toBe(200);
  });
});
