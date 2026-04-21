jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { DELETE, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("admin allowed phone number detail route proxy", () => {
  const originalFetch = global.fetch;
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminApiProxySecret = process.env.ADMIN_API_PROXY_SECRET;

  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    process.env.ADMIN_API_BASE_URL = "http://api.example.test";
    process.env.ADMIN_API_PROXY_SECRET = "proxy-secret";
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
    process.env.ADMIN_API_PROXY_SECRET = originalAdminApiProxySecret;
  });

  it("forwards updates to the API server", async () => {
    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/allowed-phone-numbers/allow-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: "01012345678" }),
      }) as never,
      { params: Promise.resolve({ id: "allow-1" }) } as never,
    );

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/allowed-phone-numbers/allow-1",
      expect.objectContaining({ method: "PUT", body: expect.any(Buffer) }),
    );
  });

  it("forwards deletes to the API server", async () => {
    const response = await DELETE(
      new Request("http://localhost:3000/api/admin/allowed-phone-numbers/allow-1", {
        method: "DELETE",
      }) as never,
      { params: Promise.resolve({ id: "allow-1" }) } as never,
    );

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/allowed-phone-numbers/allow-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
