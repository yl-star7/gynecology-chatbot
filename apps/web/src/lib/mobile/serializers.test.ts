import { resolveRecentChatPreview, toHomeViewData } from "./serializers";

describe("toHomeViewData", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-04T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  const baseInput = {
    user: { display_name: "김수연" },
    profile: {
      pregnancy_day_count: 128,
      pregnancy_week: 18,
      pregnancy_day_in_week: 2,
    },
    calendarRows: [] as Array<{ date: string; summary: string | null; entry_type?: string | null }>,
  };

  it("builds 30 days for April", () => {
    const home = toHomeViewData({
      ...baseInput,
      month: "2026-04",
    });

    expect(home.calendarDays).toHaveLength(30);
    expect(home.calendarDays.at(-1)?.isoDate).toBe("2026-04-30");
  });

  it("builds 29 days for leap-year February", () => {
    const home = toHomeViewData({
      ...baseInput,
      month: "2024-02",
    });

    expect(home.calendarDays).toHaveLength(29);
    expect(home.calendarDays.at(-1)?.isoDate).toBe("2024-02-29");
  });

  it("marks info-view days separately from chat days", () => {
    const home = toHomeViewData({
      ...baseInput,
      month: "2026-04",
      calendarRows: [
        { date: "2026-04-03", summary: "정보 확인", entry_type: "today_info_view" },
      ],
    });

    expect(home.calendarDays[2]).toMatchObject({
      isoDate: "2026-04-03",
      hasChat: true,
      hasInfo: true,
    });
  });

  it("recomputes week label from due_date so home and today share the same pregnancy state", () => {
    const home = toHomeViewData({
      ...baseInput,
      month: "2026-04",
      profile: {
        pregnancy_day_count: 99,
        pregnancy_week: 14,
        pregnancy_day_in_week: 1,
        due_date: "2026-07-01",
      },
    });

    expect(home.pregnancyDayCount).toBe(206);
    expect(home.pregnancyWeekLabel).toBe("29주 3일");
  });
});

describe("resolveRecentChatPreview", () => {
  it("returns event actions summary for quick replies", () => {
    expect(
      resolveRecentChatPreview({
        plainText: null,
        parts: [
          {
            type: "quickReplies",
            choices: [{}, {}, {}],
          },
        ],
      }),
    ).toBe("event {actions(3)}");
  });

  it("returns event part name when only non-text structured parts exist", () => {
    expect(
      resolveRecentChatPreview({
        plainText: null,
        parts: [
          {
            type: "deepLink",
          },
        ],
      }),
    ).toBe("event {deepLink}");
  });

  it("prefers plain text when available", () => {
    expect(
      resolveRecentChatPreview({
        plainText: "  불안해서 잠이 안 와요.  ",
        parts: [
          {
            type: "quickReplies",
            choices: [{}, {}, {}],
          },
        ],
      }),
    ).toBe("불안해서 잠이 안 와요.");
  });
});
