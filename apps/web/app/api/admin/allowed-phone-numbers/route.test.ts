jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/create-admin-services", () => ({
  createAdminServices: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";
import { GET, POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedCreateAdminServices = createAdminServices as jest.MockedFunction<
  typeof createAdminServices
>;

describe("admin allowed phone numbers route", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedCreateAdminServices.mockReset();
  });

  it("creates an allowed phone number for authenticated admins", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    const createAllowedPhoneNumber = jest.fn().mockResolvedValue({
      id: "allow-1",
      phoneNumber: "+821012345678",
      displayName: "김수연",
      note: "중복 테스트",
      createdAt: "2026-03-27T00:00:00.000Z",
      updatedAt: "2026-03-27T00:00:00.000Z",
    });
    mockedCreateAdminServices.mockReturnValue({
      adminUserPort: {
        listAllowedPhoneNumbers: jest.fn(),
        createAllowedPhoneNumber,
      },
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/allowed-phone-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: "01012345678",
          displayName: "김수연",
          note: "중복 테스트",
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(createAllowedPhoneNumber).toHaveBeenCalledWith({
      actorId: "admin-1",
      phoneNumber: "01012345678",
      displayName: "김수연",
      note: "중복 테스트",
    });
  });

  it("lists allowed phone numbers for authenticated admins", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    mockedCreateAdminServices.mockReturnValue({
      adminUserPort: {
        listAllowedPhoneNumbers: jest.fn().mockResolvedValue([
          {
            id: "allow-1",
            phoneNumber: "+821012345678",
            displayName: "김수연",
            note: null,
            createdAt: "2026-03-27T00:00:00.000Z",
            updatedAt: "2026-03-27T00:00:00.000Z",
          },
        ]),
      },
    } as never);

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      allowedPhoneNumbers: [
        expect.objectContaining({
          id: "allow-1",
          phoneNumber: "+821012345678",
        }),
      ],
    });
  });
});
