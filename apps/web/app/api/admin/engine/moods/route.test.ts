jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/api-server", () => ({
  proxyAdminApiRequest: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

import { GET, POST } from "./route";
import { PATCH } from "./[id]/route";

const mockedAuth = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedProxy = proxyAdminApiRequest as jest.MockedFunction<
  typeof proxyAdminApiRequest
>;

function admin() {
  return {
    id: "admin-1",
    displayName: "운영자",
    phoneNumber: "010",
    role: "admin",
  } as const;
}

describe("/api/admin/engine/moods proxy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.mockResolvedValue(admin() as never);
    mockedProxy.mockResolvedValue(
      Response.json({ ok: true }) as unknown as Awaited<
        ReturnType<typeof proxyAdminApiRequest>
      >,
    );
  });

  it("returns 401 when admin session is missing", async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/admin/engine/moods"),
    );

    expect(response.status).toBe(401);
    expect(mockedProxy).not.toHaveBeenCalled();
  });

  it("proxies list requests with query params to the admin API", async () => {
    await GET(
      new Request("http://localhost/api/admin/engine/moods?active=true"),
    );

    expect(mockedProxy).toHaveBeenCalledWith("engine/moods?active=true", {
      admin: expect.objectContaining({ id: "admin-1" }),
      method: "GET",
    });
  });

  it("proxies create requests with the original request body", async () => {
    const request = new Request("http://localhost/api/admin/engine/moods", {
      method: "POST",
      body: JSON.stringify({ prompt_suffix: "저장" }),
    });

    await POST(request);

    expect(mockedProxy).toHaveBeenCalledWith("engine/moods", {
      admin: expect.objectContaining({ id: "admin-1" }),
      request,
      method: "POST",
    });
  });

  it("proxies update requests to the selected variant id", async () => {
    const request = new Request(
      "http://localhost/api/admin/engine/moods/variant-1",
      {
        method: "PATCH",
        body: JSON.stringify({ prompt_suffix: "업데이트" }),
      },
    );

    await PATCH(request, {
      params: Promise.resolve({ id: "variant-1" }),
    });

    expect(mockedProxy).toHaveBeenCalledWith("engine/moods/variant-1", {
      admin: expect.objectContaining({ id: "admin-1" }),
      request,
      method: "PATCH",
    });
  });
});
