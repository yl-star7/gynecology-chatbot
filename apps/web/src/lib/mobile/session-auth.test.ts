jest.mock("@/lib/supabase/admin-client", () => {
  const mockSelect = jest.fn();
  return {
    supabaseSelect: mockSelect,
    supabaseUpdate: jest.fn(),
    getSupabaseAdminClient: jest.fn(() => {
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

import { supabaseSelect, supabaseUpdate } from "@/lib/supabase/admin-client";
import { requireMobileSession } from "./session-auth";

const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedSupabaseUpdate = supabaseUpdate as jest.MockedFunction<
  typeof supabaseUpdate
>;

describe("requireMobileSession", () => {
  beforeEach(() => {
    mockedSupabaseSelect.mockReset();
    mockedSupabaseUpdate.mockReset();
  });

  it("blocks paused users even when the auth session is valid", async () => {
    mockedSupabaseSelect
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
