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

describe("POST /api/admin/users/status", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateAdminServices.mockReset();
  });

  it("updates a user's status for authenticated admins", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    const updateUserStatus = jest.fn().mockResolvedValue(undefined);
    mockedCreateAdminServices.mockReturnValue({
      adminUserPort: {
        updateUserStatus,
      },
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/users/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          status: "paused",
          reason: "도배성 사용 방지",
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(updateUserStatus).toHaveBeenCalledWith({
      actorId: "admin-1",
      userId: "user-1",
      status: "paused",
      reason: "도배성 사용 방지",
    });
  });
});
