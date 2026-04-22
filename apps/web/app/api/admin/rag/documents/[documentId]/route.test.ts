jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/admin-cache", () => ({
  revalidateAdminDocumentsCache: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { DELETE, GET, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("/api/admin/rag/documents/[documentId] proxy", () => {
  const originalFetch = global.fetch;
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminApiProxySecret = process.env.ADMIN_API_PROXY_SECRET;

  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    process.env.ADMIN_API_BASE_URL = "http://api.example.test";
    process.env.ADMIN_API_PROXY_SECRET = "proxy-secret";
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ document: { id: "doc-1" } }), {
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

  test("forwards GET/PATCH/DELETE requests", async () => {
    await GET({} as Request, { params: Promise.resolve({ documentId: "doc-1" }) });
    await PATCH(
      new Request("http://localhost/api/admin/rag/documents/doc-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "doc" }),
      }) as never,
      { params: Promise.resolve({ documentId: "doc-1" }) },
    );
    await DELETE({} as Request, { params: Promise.resolve({ documentId: "doc-1" }) });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://api.example.test/api/admin/rag/documents/doc-1",
      expect.objectContaining({ method: "GET" }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://api.example.test/api/admin/rag/documents/doc-1",
      expect.objectContaining({ method: "PATCH", body: expect.any(Buffer) }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "http://api.example.test/api/admin/rag/documents/doc-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
