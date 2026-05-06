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

var adminDbInsertMock: jest.Mock;
var adminDbSelectMock: jest.Mock;
var adminDbUpdateMock: jest.Mock;

jest.mock("@/lib/db/admin-client", () => {
  adminDbInsertMock = jest.fn();
  adminDbSelectMock = jest.fn();
  adminDbUpdateMock = jest.fn();

  return {
    dbInsert: adminDbInsertMock,
    dbSelect: adminDbSelectMock,
    dbUpdate: adminDbUpdateMock,
  };
});

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { dbInsert, dbSelect, dbUpdate } from "@/lib/db/admin-client";
import { GET, POST } from "./route";

const mockedRequireMobileSession = requireMobileSession as jest.MockedFunction<
  typeof requireMobileSession
>;
const mockedDbInsert = dbInsert as jest.MockedFunction<typeof dbInsert>;
const mockedDbSelect = dbSelect as jest.MockedFunction<typeof dbSelect>;
const mockedDbUpdate = dbUpdate as jest.MockedFunction<typeof dbUpdate>;

describe("GET /api/mobile/records", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedDbInsert.mockReset();
    mockedDbSelect.mockReset();
    mockedDbUpdate.mockReset();
  });

  it("체크리스트 라벨에서 괄호 참고표기를 제거한다", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedDbSelect
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-24" }] as never)
      .mockResolvedValueOnce([
        {
          id: "check-1",
          title: "가렵지 않게 자주 발라 주세요 (1)(3)(5)(8)",
          description: null,
          display_order: 1,
        },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-24" }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/records?userId=user-1&date=2026-04-13",
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await GET(request as never);

    await expect(response.json()).resolves.toEqual({
      recordDay: expect.objectContaining({
        checklistItems: [
          {
            id: "check-1",
            label: "가렵지 않게 자주 발라 주세요",
            completed: false,
          },
        ],
      }),
    });
  });

  it("related session preview를 structured event 요약으로 내려준다", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedDbSelect
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-24" }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          id: "record-1",
          title: "상담 기록",
          summary: null,
          entry_type: "chat",
          session_id: "session-1",
          payload: null,
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          session_id: "session-1",
          last_message_at: "2026-04-13T10:00:00.000Z",
        },
      ] as never)
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
      ] as never)
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-24" }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/records?userId=user-1&date=2026-04-13",
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await GET(request as never);
    const payload = await response.json();

    expect(payload.recordDay.relatedSessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "session-1",
          preview: "event {actions(3)}",
        }),
      ]),
    );
  });

  it("전체 대화 요약과 채팅창 단위 요약을 분리해서 내려준다", async () => {
    const longDailySummary = "가".repeat(200);
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedDbSelect
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-24" }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          id: "daily-summary",
          title: "하루 요약",
          summary: longDailySummary,
          entry_type: "ai_summary",
          session_id: null,
          payload: {
            source: "daily_conversation_summary",
            summaryVersion: "detailed_v2",
          },
        },
        {
          id: "session-summary",
          title: "채팅",
          summary: "기분과 날짜 질문 주제를 간략히 정리했어요.",
          entry_type: "ai_summary",
          session_id: "session-1",
          payload: {
            source: "midnight_cron",
            summaryVersion: "session_topic_v2",
          },
        },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          id: "session-1",
          title: "기분과 질문 대화",
          last_message_at: "2026-04-13T10:00:00.000Z",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          session_id: "session-1",
          plain_text: "마지막 원문 메시지",
          parts: [],
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-24" }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/records?userId=user-1&date=2026-04-13",
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await GET(request as never);
    const payload = await response.json();

    expect(payload.recordDay.conversationSummary).toBe("가".repeat(170));
    expect(payload.recordDay.conversationSummary).toHaveLength(170);
    expect(payload.recordDay.relatedSessions).toEqual([
      expect.objectContaining({
        id: "session-1",
        preview: "기분과 날짜 질문 주제를 간략히 정리했어요.",
        summary: "기분과 날짜 질문 주제를 간략히 정리했어요.",
        isReadOnly: true,
      }),
    ]);
  });

  it("view 기반 오늘 대화 세션도 relatedSessions에 포함한다", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedDbSelect
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-24" }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          session_id: "session-2",
          last_message_at: "2026-04-13T11:00:00.000Z",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "session-2",
          title: "오늘 이어진 상담",
          last_message_at: "2026-04-13T11:00:00.000Z",
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          session_id: "session-2",
          plain_text: "오늘도 불안해요",
          parts: [],
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-24" }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/records?userId=user-1&date=2026-04-13",
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await GET(request as never);
    const payload = await response.json();

    expect(payload.recordDay.relatedSessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "session-2",
          preview: "오늘도 불안해요",
        }),
      ]),
    );
  });

  it("due_date 기준 주차로 오늘 캘린더 상세 체크리스트 완료 상태를 읽는다", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedDbSelect
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
          due_date: "2026-07-01",
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-28" }] as never)
      .mockResolvedValueOnce([
        {
          id: "check-due-date",
          title: "예정일 기준 체크리스트",
          description: null,
          display_order: 1,
        },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        { checklist_id: "check-due-date", status: "completed" },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          pregnancy_day_count: 165,
          pregnancy_week: 24,
          pregnancy_day_in_week: 4,
          due_date: "2026-07-01",
        },
      ] as never)
      .mockResolvedValueOnce([{ id: "week-28" }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/records?userId=user-1&date=2026-04-13",
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await GET(request as never);

    expect(mockedDbSelect).toHaveBeenCalledWith(
      expect.stringContaining(
        "content_pregnancy_week_data?select=id&week_number=eq.28&status=eq.published&limit=1",
      ),
    );
    await expect(response.json()).resolves.toEqual({
      recordDay: expect.objectContaining({
        checklistItems: [
          {
            id: "check-due-date",
            label: "예정일 기준 체크리스트",
            completed: true,
          },
        ],
      }),
    });
  });
});

describe("POST /api/mobile/records", () => {
  beforeEach(() => {
    mockedRequireMobileSession.mockReset();
    mockedDbInsert.mockReset();
    mockedDbSelect.mockReset();
    mockedDbUpdate.mockReset();
  });

  it("updates profileMemory.lastEmotionTone when emotion check-in is saved", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedDbInsert.mockResolvedValue([] as never);
    mockedDbSelect.mockResolvedValue([] as never);
    mockedDbUpdate.mockResolvedValue([] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/records?userId=user-1",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          emotionTone: "anxious",
        }),
      },
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(mockedDbUpdate).toHaveBeenCalledWith(
      "pregnancy_profiles?user_id=eq.user-1",
      expect.objectContaining({
        onboarding_payload: expect.objectContaining({
          profileMemory: expect.objectContaining({
            lastEmotionTone: "anxious",
          }),
        }),
      }),
    );
  });

  it("preserves existing onboarding payload fields when profileMemory is updated", async () => {
    mockedRequireMobileSession.mockResolvedValue({
      userId: "user-1",
      sessionToken: "token-1",
    } as never);
    mockedDbInsert.mockResolvedValue([] as never);
    mockedDbSelect.mockResolvedValueOnce([
      {
        onboarding_payload: {
          tonePreference: "차분하게",
          babyName: "콩이",
          profileMemory: {
            lastEmotionTone: "calm",
          },
        },
      },
    ] as never);
    mockedDbUpdate.mockResolvedValue([] as never);

    const request = new Request(
      "http://localhost:3000/api/mobile/records?userId=user-1",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-1",
          sessionId: "session-1",
          emotionTone: "sad",
        }),
      },
    ) as Request & { nextUrl: URL };
    request.nextUrl = new URL(request.url);

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(mockedDbUpdate).toHaveBeenCalledWith(
      "pregnancy_profiles?user_id=eq.user-1",
      expect.objectContaining({
        onboarding_payload: expect.objectContaining({
          tonePreference: "차분하게",
          babyName: "콩이",
          profileMemory: expect.objectContaining({
            lastEmotionTone: "sad",
          }),
        }),
      }),
    );
  });
});
