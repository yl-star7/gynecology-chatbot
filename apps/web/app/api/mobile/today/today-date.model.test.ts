import {
  calculateCurrentPregnancyWeek,
  createKstDateKey,
} from "./today-date.model";

describe("today-date model", () => {
  it("uses the Korean calendar day at the UTC/KST day boundary", () => {
    expect(createKstDateKey(new Date("2026-04-20T14:59:00.000Z"))).toBe(
      "2026-04-20",
    );
    expect(createKstDateKey(new Date("2026-04-20T15:01:00.000Z"))).toBe(
      "2026-04-21",
    );
  });

  it("advances pregnancy day from the KST date, not the server UTC date", () => {
    const beforeMidnight = calculateCurrentPregnancyWeek(
      "2026-07-01",
      createKstDateKey(new Date("2026-04-20T14:59:00.000Z")),
    );
    const afterMidnight = calculateCurrentPregnancyWeek(
      "2026-07-01",
      createKstDateKey(new Date("2026-04-20T15:01:00.000Z")),
    );

    expect(afterMidnight.dayInWeek).toBe(
      (beforeMidnight.dayInWeek + 1) % 7,
    );
  });
});
