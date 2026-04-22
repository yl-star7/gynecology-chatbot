jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { GET } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("GET /api/admin/analytics proxy", () => {
  const originalFetch = global.fetch;
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminApiProxySecret = process.env.ADMIN_API_PROXY_SECRET;

  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    process.env.ADMIN_API_BASE_URL = "http://api.example.test";
    process.env.ADMIN_API_PROXY_SECRET = "proxy-secret";
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ totalUsers: 2 }), {
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

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("forwards analytics requests to the API server", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ totalUsers: 2 });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/analytics",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
