import { toHomeViewData } from "./serializers";

describe("toHomeViewData", () => {
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
});
