jest.mock("@playwright/test", () => ({
  request: {
    newContext: jest.fn(async () => ({
      post: jest.fn(async () => ({
        ok: () => true,
        status: () => 200,
        text: async () => "",
      })),
      storageState: jest.fn(async () => undefined),
      dispose: jest.fn(async () => undefined),
    })),
  },
}));

import setup from "./global-setup";

describe("e2e global setup strict env", () => {
  const originalBaseUrl = process.env.E2E_BASE_URL;
  const originalAdminPhone = process.env.E2E_ADMIN_PHONE_NUMBER;
  const originalAdminPassword = process.env.E2E_ADMIN_PASSWORD;

  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.E2E_BASE_URL;
    } else {
      process.env.E2E_BASE_URL = originalBaseUrl;
    }

    if (originalAdminPhone === undefined) {
      delete process.env.E2E_ADMIN_PHONE_NUMBER;
    } else {
      process.env.E2E_ADMIN_PHONE_NUMBER = originalAdminPhone;
    }

    if (originalAdminPassword === undefined) {
      delete process.env.E2E_ADMIN_PASSWORD;
    } else {
      process.env.E2E_ADMIN_PASSWORD = originalAdminPassword;
    }
  });

  it("throws when E2E_BASE_URL is missing", async () => {
    delete process.env.E2E_BASE_URL;
    process.env.E2E_ADMIN_PHONE_NUMBER = "01099998888";
    process.env.E2E_ADMIN_PASSWORD = "admin1234";

    await expect(setup({} as never)).rejects.toThrow(
      "E2E_BASE_URL is required",
    );
  });

  it("throws when E2E admin credentials are missing", async () => {
    process.env.E2E_BASE_URL = "http://localhost:4000";
    delete process.env.E2E_ADMIN_PHONE_NUMBER;
    delete process.env.E2E_ADMIN_PASSWORD;

    await expect(setup({} as never)).rejects.toThrow(
      "E2E_ADMIN_PHONE_NUMBER is required",
    );
  });
});
