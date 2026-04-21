jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/admin-cache", () => ({
  revalidateAdminWeeksCache: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { revalidateAdminWeeksCache } from "@/lib/admin/admin-cache";
import { GET, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedRevalidateAdminWeeksCache =
  revalidateAdminWeeksCache as jest.MockedFunction<
    typeof revalidateAdminWeeksCache
  >;

describe("/api/admin/content/weeks/[weekNumber] proxy", () => {
  const originalFetch = global.fetch;
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminApiProxySecret = process.env.ADMIN_API_PROXY_SECRET;

  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedRevalidateAdminWeeksCache.mockReset();
    process.env.ADMIN_API_BASE_URL = "http://api.example.test";
    process.env.ADMIN_API_PROXY_SECRET = "proxy-secret";
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ week: { weekNumber: 7 } }), {
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

  test("forwards detail requests to the API server", async () => {
    const response = await GET({} as Request, {
      params: Promise.resolve({ weekNumber: "7" }),
    });

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/content/weeks/7",
      expect.objectContaining({ method: "GET" }),
    );
  });

  test("rejects invalid week numbers before proxying", async () => {
    const response = await GET({} as Request, {
      params: Promise.resolve({ weekNumber: "99" }),
    });

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("forwards updates and revalidates successful responses", async () => {
    const response = await PATCH(
      new Request("http://localhost:3000/api/admin/content/weeks/7", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "7주차" }),
      }) as never,
      {
        params: Promise.resolve({ weekNumber: "7" }),
      },
    );

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/content/weeks/7",
      expect.objectContaining({ method: "PATCH", body: expect.any(Buffer) }),
    );
    expect(mockedRevalidateAdminWeeksCache).toHaveBeenCalledWith(7);
  });
});
