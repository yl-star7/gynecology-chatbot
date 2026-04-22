jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { GET, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("admin content paraphrases route proxy", () => {
  const originalFetch = global.fetch;
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminApiProxySecret = process.env.ADMIN_API_PROXY_SECRET;

  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    process.env.ADMIN_API_BASE_URL = "http://api.example.test";
    process.env.ADMIN_API_PROXY_SECRET = "proxy-secret";
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ paraphrases: [] }), {
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

  test("forwards reads to the API server", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/content/paraphrases?weekNumber=19"),
    );
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/content/paraphrases?weekNumber=19",
      expect.objectContaining({ method: "GET" }),
    );
  });

  test("forwards activation patches to the API server", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/content/paraphrases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: "item-1", action: "activate" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/content/paraphrases",
      expect.objectContaining({ method: "PATCH", body: expect.any(Buffer) }),
    );
  });
});
