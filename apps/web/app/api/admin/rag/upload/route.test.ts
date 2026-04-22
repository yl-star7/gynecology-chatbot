jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/admin-cache", () => ({
  revalidateAdminDocumentsCache: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { revalidateAdminDocumentsCache } from "@/lib/admin/admin-cache";
import { POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("POST /api/admin/rag/upload proxy", () => {
  const originalFetch = global.fetch;
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminApiProxySecret = process.env.ADMIN_API_PROXY_SECRET;

  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    process.env.ADMIN_API_BASE_URL = "http://api.example.test";
    process.env.ADMIN_API_PROXY_SECRET = "proxy-secret";
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ id: "doc-1", ok: true }), {
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

  test("forwards upload requests and revalidates documents", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/rag/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "문서", content: "본문", category: "guide" }),
      }) as never,
    );
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/rag/upload",
      expect.objectContaining({ method: "POST", body: expect.any(Buffer) }),
    );
    expect(revalidateAdminDocumentsCache).toHaveBeenCalled();
  });
});
