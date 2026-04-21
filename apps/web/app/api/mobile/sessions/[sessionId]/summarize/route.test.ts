jest.mock("@/lib/mobile/session-auth", () => ({
  requireMobileSession: jest.fn(),
  mobileNoStoreJson: jest.fn((payload: unknown, init?: ResponseInit) =>
    Response.json(payload, {
      ...init,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        ...(init?.headers as Record<string, string> | undefined),
      },
    }),
  ),
  mobileRouteErrorResponse: jest.fn((error: unknown, fallbackMessage: string) =>
    Response.json(
      { error: error instanceof Error ? error.message : fallbackMessage },
      { status: 500 },
    ),
  ),
}));

jest.mock("@gynecology-chatbot/mobile-api/chat/session-summary", () => {
  class MobileChatSessionNotFoundError extends Error {}

  return {
    MobileChatSessionNotFoundError,
    summarizeMobileChatSession: jest.fn(),
  };
});

import { requireMobileSession } from "@/lib/mobile/session-auth";
import {
  MobileChatSessionNotFoundError,
  summarizeMobileChatSession,
} from "@gynecology-chatbot/mobile-api/chat/session-summary";
import { POST } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedSummarizeMobileChatSession =
  summarizeMobileChatSession as jest.MockedFunction<
    typeof summarizeMobileChatSession
  >;

function createRequest() {
  const request = new Request(
    "http://localhost:3000/api/mobile/sessions/session-1/summarize?userId=user-1",
  ) as Request & { nextUrl: URL };
  request.nextUrl = new URL(request.url);
  return request;
}

describe("POST /api/mobile/sessions/[sessionId]/summarize", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedSummarizeMobileChatSession.mockReset();
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
  });

  it("summarizes the authenticated user's session", async () => {
    mockedSummarizeMobileChatSession.mockResolvedValue({
      summarized: true,
      summary: "대화를 따뜻하게 정리했어요.",
    });

    const response = await POST(createRequest() as never, {
      params: Promise.resolve({ sessionId: "session-1" }),
    });
    const payload = await response.json();

    expect(mockedRequireMobileSession).toHaveBeenCalledWith(
      expect.any(Request),
      "user-1",
    );
    expect(mockedSummarizeMobileChatSession).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: "session-1",
    });
    expect(payload).toEqual({
      summarized: true,
      summary: "대화를 따뜻하게 정리했어요.",
    });
  });

  it("keeps the not-found response for sessions outside the user", async () => {
    mockedSummarizeMobileChatSession.mockRejectedValue(
      new MobileChatSessionNotFoundError(),
    );

    const response = await POST(createRequest() as never, {
      params: Promise.resolve({ sessionId: "session-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({ error: "session not found" });
  });
});
