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

jest.mock("@gynecology-chatbot/mobile-api/chat/session-route-helpers", () => ({
  loadMobileChatSessions: jest.fn(),
}));

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { loadMobileChatSessions } from "@gynecology-chatbot/mobile-api/chat/session-route-helpers";
import { GET } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedLoadMobileChatSessions =
  loadMobileChatSessions as jest.MockedFunction<typeof loadMobileChatSessions>;

describe("GET /api/mobile/sessions", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedLoadMobileChatSessions.mockReset();
  });

  it("인증된 사용자의 채팅 세션 목록을 반환한다", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedLoadMobileChatSessions.mockResolvedValue([
      {
        id: "session-1",
        title: "오늘 상담",
        preview: "event {actions(3)}",
        updatedAtLabel: "오후 7:00",
        updatedAtIso: "2026-04-13T10:00:00.000Z",
      },
    ] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/sessions?userId=user-1",
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await GET(request as never);
    const payload = await response.json();

    expect(mockedRequireMobileSession).toHaveBeenCalledWith(
      expect.any(Request),
      "user-1",
    );
    expect(mockedLoadMobileChatSessions).toHaveBeenCalledWith("user-1");
    expect(payload.sessions).toEqual([
      expect.objectContaining({
        id: "session-1",
        preview: "event {actions(3)}",
      }),
    ]);
  });

  it("세션 닫힘 요약 preview를 그대로 전달한다", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedLoadMobileChatSessions.mockResolvedValue([
      {
        id: "session-1",
        title: "오늘 상담",
        preview: "요통 걱정을 나누고 쉬는 자세를 안내받았어요.",
        updatedAtLabel: "오후 7:00",
        updatedAtIso: "2026-04-13T10:00:00.000Z",
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
        preview: "요통 걱정을 나누고 쉬는 자세를 안내받았어요.",
      }),
    ]);
  });
});
