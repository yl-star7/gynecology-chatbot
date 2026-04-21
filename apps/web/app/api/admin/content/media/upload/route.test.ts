jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("POST /api/admin/content/media/upload proxy", () => {
  const originalFetch = global.fetch;
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminApiProxySecret = process.env.ADMIN_API_PROXY_SECRET;

  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    } as never);
    process.env.ADMIN_API_BASE_URL = "http://api.example.test";
    process.env.ADMIN_API_PROXY_SECRET = "proxy-secret";
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          bucketId: "pregnancy-content",
          objectPath: "weeks/02/123-cover.png",
          sourceFileName: "cover.png",
          signedUrl: "https://storage.example.test/upload",
          token: null,
          contentType: "image/png",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    ) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ADMIN_API_BASE_URL = originalAdminApiBaseUrl;
    process.env.ADMIN_API_PROXY_SECRET = originalAdminApiProxySecret;
  });

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/content/media/upload", {
        method: "POST",
        body: new FormData(),
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("forwards media uploads to the API server", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/admin/content/media/upload", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "upload-request",
      }) as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        ok: true,
        objectPath: "weeks/02/123-cover.png",
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/content/media/upload",
      expect.objectContaining({ method: "POST", body: expect.any(Buffer) }),
    );
    const headers = (global.fetch as jest.Mock).mock.calls[0][1]
      .headers as Headers;
    expect(headers.get("x-admin-user-id")).toBe("admin-1");
    expect(headers.get("x-admin-proxy-secret")).toBe("proxy-secret");
  });
});
