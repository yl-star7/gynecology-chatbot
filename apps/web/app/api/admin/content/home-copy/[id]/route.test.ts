jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { DELETE, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("/api/admin/content/home-copy/[id] proxy", () => {
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

  test("forwards updates", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/content/home-copy/copy-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "copy" }),
      }),
      { params: Promise.resolve({ id: "copy-1" }) },
    );
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/content/home-copy/copy-1",
      expect.objectContaining({ method: "PATCH", body: expect.any(Buffer) }),
    );
  });

  test("forwards deletes", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/admin/content/home-copy/copy-1"),
      { params: Promise.resolve({ id: "copy-1" }) },
    );
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/content/home-copy/copy-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
