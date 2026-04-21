jest.mock("@gynecology-chatbot/mobile-api/chat/session-summary", () => ({
  summarizeUnsummarizedMobileChatSessions: jest.fn(async () => ({
    targetDate: "2026-04-20",
    consideredSessions: 1,
    summarizedSessions: 1,
    skippedSessions: {
      already_summarized: 0,
      empty_summary: 0,
      not_enough_turns: 0,
      same_day_deferred: 0,
    },
    errors: [],
  })),
}));

import { summarizeUnsummarizedMobileChatSessions } from "@gynecology-chatbot/mobile-api/chat/session-summary";
import { GET } from "./route";

const mockedSummarizeUnsummarizedMobileChatSessions =
  summarizeUnsummarizedMobileChatSessions as jest.MockedFunction<
    typeof summarizeUnsummarizedMobileChatSessions
  >;

function createRequest(input?: { targetDate?: string; limit?: string }) {
  const url = new URL("http://localhost:3000/api/cron/session-summaries");
  if (input?.targetDate) {
    url.searchParams.set("targetDate", input.targetDate);
  }
  if (input?.limit) {
    url.searchParams.set("limit", input.limit);
  }

  const request = new Request(url, {
    headers: { authorization: "Bearer test-cron-secret" },
  }) as Request & { nextUrl: URL };
  request.nextUrl = url;
  return request;
}

describe("GET /api/cron/session-summaries", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    mockedSummarizeUnsummarizedMobileChatSessions.mockClear();
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  test("rejects requests without the cron secret", async () => {
    const request = new Request(
      "http://localhost:3000/api/cron/session-summaries",
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await GET(request as never);

    expect(response.status).toBe(401);
    expect(
      mockedSummarizeUnsummarizedMobileChatSessions,
    ).not.toHaveBeenCalled();
  });

  test("runs bulk session summarization with optional targeting", async () => {
    const response = await GET(
      createRequest({ targetDate: "2026-04-20", limit: "25" }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockedSummarizeUnsummarizedMobileChatSessions).toHaveBeenCalledWith({
      targetDate: "2026-04-20",
      limit: 25,
    });
    expect(payload).toEqual(
      expect.objectContaining({
        targetDate: "2026-04-20",
        consideredSessions: 1,
        summarizedSessions: 1,
      }),
    );
  });
});
