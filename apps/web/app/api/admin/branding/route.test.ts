jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { GET, PUT } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("/api/admin/branding proxy", () => {
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
          mascotBucketId: null,
          mascotObjectPath: null,
          surveyFormUrl: null,
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

  test("forwards GET requests to the API server", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/branding",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
      }),
    );
    const headers = (global.fetch as jest.Mock).mock.calls[0][1]
      .headers as Headers;
    expect(headers.get("x-admin-user-id")).toBe("admin-1");
    expect(headers.get("x-admin-proxy-secret")).toBe("proxy-secret");
  });

  test("forwards PUT payload validation to the API server", async () => {
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({
          error: "survey form url must be a valid Google Forms https URL",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    ) as typeof fetch;

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
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/branding",
      expect.objectContaining({
        method: "PUT",
        body: expect.any(Buffer),
      }),
    );
  });
});
