import { isKstDateToday } from "./chat-repository";

describe("isKstDateToday", () => {
  it("compares chat session dates using Korean calendar days", () => {
    const afterKoreanMidnight = new Date("2026-04-20T15:30:00.000Z");

    expect(
      isKstDateToday("2026-04-20T14:50:00.000Z", afterKoreanMidnight),
    ).toBe(false);
    expect(
      isKstDateToday("2026-04-20T15:05:00.000Z", afterKoreanMidnight),
    ).toBe(true);
  });
});
