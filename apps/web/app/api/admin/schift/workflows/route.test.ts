jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/mobile/schift-workflows-api", () => ({
  listSchiftWorkflows: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { listSchiftWorkflows } from "@/lib/mobile/schift-workflows-api";
import { GET } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedListSchiftWorkflows = listSchiftWorkflows as jest.MockedFunction<
  typeof listSchiftWorkflows
>;
describe("/api/admin/schift/workflows", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedListSchiftWorkflows.mockReset();
  });

  test("returns 503 when Schift listing is unavailable", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedListSchiftWorkflows.mockRejectedValue(
      new Error("Schift unavailable"),
    );

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Schift unavailable",
    });
  });
});
