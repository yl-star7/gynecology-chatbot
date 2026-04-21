import { toChatSession, toHomeViewData, toRecentChats } from "./serializers";

describe("mobile serializers date handling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("recomputes due_date metrics from the Korean calendar day before UTC midnight", () => {
    jest.setSystemTime(new Date("2026-04-03T15:01:00.000Z"));

    const home = toHomeViewData({
      user: { display_name: "김수연" },
      profile: {
        pregnancy_day_count: 99,
        pregnancy_week: 14,
        pregnancy_day_in_week: 1,
        due_date: "2026-07-01",
      },
      calendarRows: [],
      month: "2026-04",
    });

    expect(home.pregnancyDayCount).toBe(206);
    expect(home.pregnancyWeekLabel).toBe("29주 3일");
  });

  it("formats recent chat labels with Korean time today and yesterday boundaries", () => {
    jest.setSystemTime(new Date("2026-04-20T15:10:00.000Z"));

    const sessions = toRecentChats([
      {
        id: "yesterday",
        title: "어제 대화",
        last_message_at: "2026-04-20T14:50:00.000Z",
        last_message_preview: "어제",
      },
      {
        id: "today",
        title: "오늘 대화",
        last_message_at: "2026-04-20T15:05:00.000Z",
        last_message_preview: "오늘",
      },
    ]);

    expect(sessions.map((session) => session.updatedAtLabel)).toEqual([
      "오늘 오전 12:05",
      "어제 오후 11:50",
    ]);
  });

  it("formats chat message createdAt labels with Korean time", () => {
    const session = toChatSession(
      {
        id: "session-1",
        title: "아기와 대화",
        last_message_at: "2026-04-20T15:05:00.000Z",
        last_message_preview: null,
      },
      [
        {
          id: "message-1",
          role: "assistant",
          parts: [{ type: "text", id: "part-1", text: "안녕하세요" }],
          created_at: "2026-04-20T15:05:00.000Z",
        },
      ],
    );

    expect(session.messages[0]?.createdAtLabel).toBe("오전 12:05");
  });
});
