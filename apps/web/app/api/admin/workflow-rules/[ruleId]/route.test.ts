jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/admin-cache", () => ({
  revalidateAdminWorkflowCache: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;

describe("PATCH /api/admin/workflow-rules/[ruleId] proxy", () => {
  const originalFetch = global.fetch;
  const originalAdminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
  const originalAdminApiProxySecret = process.env.ADMIN_API_PROXY_SECRET;

  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    process.env.ADMIN_API_BASE_URL = "http://api.example.test";
    process.env.ADMIN_API_PROXY_SECRET = "proxy-secret";
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ workflowRule: { id: "wf-1" } }), {
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

  test("forwards workflow rule updates", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/workflow-rules/wf-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "기본 응답" }),
      }) as never,
      { params: Promise.resolve({ ruleId: "wf-1" }) },
    );
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.example.test/api/admin/workflow-rules/wf-1",
      expect.objectContaining({ method: "PATCH", body: expect.any(Buffer) }),
    );
  });
});
