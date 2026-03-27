jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/create-admin-services", () => ({
  createAdminServices: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import { DELETE, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedCreateAdminServices = createAdminServices as jest.MockedFunction<
  typeof createAdminServices
>;

describe("admin allowed phone number detail route", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateAdminServices.mockReset();
  });

  it("updates an allowed phone number", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    const updateAllowedPhoneNumber = jest.fn().mockResolvedValue({
      id: "allow-1",
      phoneNumber: "+821012345678",
      displayName: "김수연",
      note: "업데이트",
      createdAt: "2026-03-27T00:00:00.000Z",
      updatedAt: "2026-03-27T00:00:00.000Z",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminUserPort: {
        updateAllowedPhoneNumber,
        deleteAllowedPhoneNumber: jest.fn(),
      },
    } as never);

    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/allowed-phone-numbers/allow-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: "01012345678",
          displayName: "김수연",
          note: "업데이트",
        }),
      }) as never,
      { params: Promise.resolve({ id: "allow-1" }) } as never,
    );

    expect(response.status).toBe(200);
    expect(updateAllowedPhoneNumber).toHaveBeenCalledWith({
      actorId: "admin-1",
      id: "allow-1",
      phoneNumber: "01012345678",
      displayName: "김수연",
      note: "업데이트",
    });
  });

  it("deletes an allowed phone number", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    const deleteAllowedPhoneNumber = jest.fn().mockResolvedValue(undefined);
    mockedCreateAdminServices.mockReturnValue({
      adminUserPort: {
        updateAllowedPhoneNumber: jest.fn(),
        deleteAllowedPhoneNumber,
      },
    } as never);

    const response = await DELETE(
      new Request("http://localhost:3000/api/admin/allowed-phone-numbers/allow-1", {
        method: "DELETE",
      }) as never,
      { params: Promise.resolve({ id: "allow-1" }) } as never,
    );

    expect(response.status).toBe(200);
    expect(deleteAllowedPhoneNumber).toHaveBeenCalledWith({
      actorId: "admin-1",
      id: "allow-1",
    });
  });
});
