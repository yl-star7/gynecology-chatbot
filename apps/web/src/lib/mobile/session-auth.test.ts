jest.mock("./supabase-rest", () => ({
  supabaseSelect: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

import { supabaseSelect, supabaseUpdate } from "./supabase-rest";
import { requireMobileSession } from "./session-auth";

const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<typeof supabaseSelect>;
const mockedSupabaseUpdate = supabaseUpdate as jest.MockedFunction<typeof supabaseUpdate>;

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

    await expect(requireMobileSession(request as never, "user-1")).rejects.toThrow(
      "mobile session user is not active",
    );
  });
});
