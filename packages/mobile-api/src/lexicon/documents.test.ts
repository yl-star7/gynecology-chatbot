import {
  buildDayDocument,
  buildDayLexiconItem,
  type GeneratedDayRow,
} from "./documents";

const DAY_20_3: GeneratedDayRow = {
  id: "day-row-20-3",
  week_data_id: "week-row-20",
  week_number: 20,
  day_number: 3,
  title: "태동 기록",
  baby_message: "작은 움직임으로 인사할 수 있어요.",
  baby_development_payload: { items: ["움직임이 더 또렷해져요."] },
  mother_changes_payload: { items: ["배가 당기는 느낌이 있을 수 있어요."] },
};

describe("lexicon generated documents", () => {
  test("uses the mobile week-day label for day documents", () => {
    expect(buildDayDocument(DAY_20_3, [], [])).toContain("# 임신 20주 2일");
    expect(buildDayLexiconItem(DAY_20_3, [], [])).toEqual(
      expect.objectContaining({
        id: "week-20-day-3",
        title: "임신 20주 2일: 태동 기록",
        day: 3,
      }),
    );
  });
});
