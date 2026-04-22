jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { GET, POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("/api/admin/content/home-copy proxy", () => {
  const originalFetch = global.fetch;
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminApiProxySecret = process.env.ADMIN_API_PROXY_SECRET;

  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    process.env.ADMIN_API_BASE_URL = "http://api.example.test";
    process.env.ADMIN_API_PROXY_SECRET = "proxy-secret";
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ homeCopyItems: [] }), {
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

  test("forwards list requests", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/content/home-copy",
      expect.objectContaining({ method: "GET" }),
    );
  });

  test("forwards create requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/content/home-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "copy" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/content/home-copy",
      expect.objectContaining({ method: "POST", body: expect.any(Buffer) }),
    );
  });
});
