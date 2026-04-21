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

var mockedPrisma: any;
jest.mock("@gynecology-chatbot/db/prisma", () => {
  mockedPrisma = {
    chat_sessions: {
      findMany: jest.fn(),
    },
    chat_messages: {
      findMany: jest.fn(),
    },
    calendar_logs: {
      findMany: jest.fn(),
    },
  };

  return { prisma: mockedPrisma };
});

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { GET } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;

describe("GET /api/mobile/sessions", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedPrisma.chat_sessions.findMany.mockReset();
    mockedPrisma.chat_messages.findMany.mockReset();
    mockedPrisma.calendar_logs.findMany.mockReset();
    mockedPrisma.calendar_logs.findMany.mockResolvedValue([]);
  });

  it("structured quick replies preview를 event actions 요약으로 반환한다", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedPrisma.chat_sessions.findMany.mockResolvedValue([
      {
        id: "session-1",
        title: "오늘 상담",
        last_message_at: new Date("2026-04-13T10:00:00.000Z"),
      },
    ]);
    mockedPrisma.chat_messages.findMany.mockResolvedValue([
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
    ]);

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

  it("세션 닫힘 요약이 있으면 채팅 세션 preview에 우선 사용한다", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedPrisma.chat_sessions.findMany.mockResolvedValue([
      {
        id: "session-1",
        title: "오늘 상담",
        last_message_at: new Date("2026-04-13T10:00:00.000Z"),
      },
    ]);
    mockedPrisma.chat_messages.findMany.mockResolvedValue([
      {
        session_id: "session-1",
        plain_text: "마지막 원문 메시지",
        parts: null,
      },
    ]);
    mockedPrisma.calendar_logs.findMany.mockResolvedValue([
      {
        session_id: "session-1",
        summary: "요통 걱정을 나누고 쉬는 자세를 안내받았어요.",
      },
    ]);

    const request = new Request(
      "http://localhost:3000/api/mobile/sessions?userId=user-1",
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await GET(request as never);
    const payload = await response.json();

    expect(payload.sessions).toEqual([
      expect.objectContaining({
        id: "session-1",
        preview: "요통 걱정을 나누고 쉬는 자세를 안내받았어요.",
      }),
    ]);
  });
});
