jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      { status: 500 },
    ),
  ),
}));

jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseSelect: jest.fn(),
}));

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { supabaseSelect } from "@/lib/supabase/admin-client";
import { GET } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;

describe("GET /api/mobile/sessions", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSupabaseSelect.mockReset();
  });

  it("structured quick replies preview를 event actions 요약으로 반환한다", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedSupabaseSelect
      .mockResolvedValueOnce([
        {
          id: "session-1",
          title: "오늘 상담",
          last_message_at: "2026-04-13T10:00:00.000Z",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          session_id: "session-1",
          plain_text: null,
          parts: [
            {
              type: "quickReplies",
              choices: [{}, {}, {}],
            },
          ],
        },
      ] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/sessions?userId=user-1",
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await GET(request as never);
    const payload = await response.json();

    expect(payload.sessions).toEqual([
      expect.objectContaining({
        id: "session-1",
        preview: "event {actions(3)}",
      }),
    ]);
  });
});
