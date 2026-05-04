jest.mock("@/lib/db/admin-client", () => {
  const mockSelect = jest.fn();
  return {
    dbSelect: mockSelect,
    dbUpdate: jest.fn(),
    getDbAdminClient: jest.fn(() => {
      const mockResult = { data: [], error: null };
      const createBuilder = () => ({
        select: createBuilder,
        eq: createBuilder,
        neq: createBuilder,
        gt: createBuilder,
        gte: createBuilder,
        lt: createBuilder,
        lte: createBuilder,
        in: createBuilder,
        order: createBuilder,
        limit: () => mockResult,
        single: () => mockResult,
        maybeSingle: () => mockResult,
      });
      const mockClient = { from: () => createBuilder() };
      return mockClient;
    }),
  };
});

import { dbSelect, dbUpdate } from "@/lib/db/admin-client";
import { requireMobileSession } from "./session-auth";

const mockedDbSelect = dbSelect as jest.MockedFunction<
  typeof dbSelect
>;
const mockedDbUpdate = dbUpdate as jest.MockedFunction<
  typeof dbUpdate
>;

describe("requireMobileSession", () => {
  beforeEach(() => {
    mockedDbSelect.mockReset();
    mockedDbUpdate.mockReset();
  });

  it("uses wrapper-backed queries in docker mode so local auth sessions remain valid", async () => {
    process.env.SERVER_DATA_PROVIDER = "docker";

    mockedDbSelect
      .mockResolvedValueOnce([
        {
          id: "session-1",
          user_id: "user-1",
          expires_at: "2099-03-27T00:00:00.000Z",
          revoked_at: null,
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "user-1",
          account_status: "active",
        },
      ] as never);

    const request = new Request("http://localhost:3000", {
      headers: {
        authorization: "Bearer session-token",
      },
    });

    await expect(requireMobileSession(request as never, "user-1")).resolves.toEqual({
      sessionId: "session-1",
      userId: "user-1",
    });

    expect(mockedDbSelect).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("auth_sessions?select=id,user_id,expires_at,revoked_at"),
    );
    expect(mockedDbSelect).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("users?select=id,account_status&id=eq.user-1"),
    );
    expect(mockedDbUpdate).toHaveBeenCalledWith(
      "auth_sessions?id=eq.session-1",
      expect.objectContaining({ last_used_at: expect.any(String) }),
    );
  });

  it("blocks paused users even when the auth session is valid", async () => {
    mockedDbSelect
      .mockResolvedValueOnce([
        {
          id: "session-1",
          user_id: "user-1",
          expires_at: "2099-03-27T00:00:00.000Z",
          revoked_at: null,
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "user-1",
          account_status: "paused",
        },
      ] as never);

    const request = new Request("http://localhost:3000", {
      headers: {
        authorization: "Bearer session-token",
      },
    });

    await expect(
      requireMobileSession(request as never, "user-1"),
    ).rejects.toThrow("mobile session user is not active");
  });
});
