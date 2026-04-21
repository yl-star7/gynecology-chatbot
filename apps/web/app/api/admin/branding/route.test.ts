jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/db/admin-client", () => ({
  dbInsert: jest.fn(),
  dbSelect: jest.fn(),
  dbUpdate: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import {
  dbInsert,
  dbSelect,
  dbUpdate,
} from "@/lib/db/admin-client";
import { PUT } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedSupabaseInsert = dbInsert as jest.MockedFunction<
  typeof dbInsert
>;
const mockedSupabaseSelect = dbSelect as jest.MockedFunction<
  typeof dbSelect
>;
const mockedSupabaseUpdate = dbUpdate as jest.MockedFunction<
  typeof dbUpdate
>;

describe("PUT /api/admin/branding", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedSupabaseInsert.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseUpdate.mockReset();
  });

  test("accepts a valid Google Forms https URL", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    } as never);
    mockedSupabaseSelect.mockResolvedValue([{ key: "ui_branding" }] as never);
    mockedSupabaseUpdate.mockResolvedValue([] as never);

    const response = await PUT(
      new Request("http://localhost:3000/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyFormUrl: "https://docs.google.com/forms/d/e/example/viewform",
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockedSupabaseUpdate).toHaveBeenCalledWith(
      "system_config?key=eq.ui_branding",
      expect.objectContaining({
        value: expect.objectContaining({
          surveyFormUrl: "https://docs.google.com/forms/d/e/example/viewform",
        }),
      }),
    );
  });

  test("rejects non-Google or non-https survey URLs", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    } as never);

    const response = await PUT(
      new Request("http://localhost:3000/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyFormUrl: "http://evil.example.com/form",
        }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "survey form url must be a valid Google Forms https URL",
    });
    expect(mockedSupabaseInsert).not.toHaveBeenCalled();
    expect(mockedSupabaseUpdate).not.toHaveBeenCalled();
  });
});
