import { toHomeViewData } from "./serializers";

describe("toHomeViewData", () => {
  const baseInput = {
    user: { display_name: "김수연" },
    profile: {
      pregnancy_day_count: 128,
      pregnancy_week: 18,
      pregnancy_day_in_week: 2,
    },
    calendarRows: [] as Array<{ date: string; summary: string | null }>,
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
});
