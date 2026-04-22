jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { GET, POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("/api/admin/users/persona proxy", () => {
  const originalFetch = global.fetch;
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminApiProxySecret = process.env.ADMIN_API_PROXY_SECRET;

  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    process.env.ADMIN_API_BASE_URL = "http://api.example.test";
    process.env.ADMIN_API_PROXY_SECRET = "proxy-secret";
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ profile: null, signals: [] }), {
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

  test("forwards reads with query string", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/users/persona?userId=user-1"),
    );
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/users/persona?userId=user-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  test("forwards manual signal writes", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/users/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user-1", personaHint: "anxious" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/users/persona",
      expect.objectContaining({ method: "POST", body: expect.any(Buffer) }),
    );
  });
});
