import { getTableName } from "drizzle-orm";

import {
  pregnancyDayContents,
  pregnancyWeekData,
  pregnancyWeekMedia,
  weekChecklists,
  weekQuestions,
} from "@/lib/db/schema/content";

describe("canonical week content drizzle schema", () => {
  it("exposes pregnancy_week_data as the root week table", () => {
    expect(getTableName(pregnancyWeekData)).toBe("pregnancy_week_data");
    expect(pregnancyWeekData).toHaveProperty("id");
    expect(pregnancyWeekData).toHaveProperty("weekNumber");
  });

  it("exposes canonical child tables for week content", () => {
    expect(getTableName(pregnancyDayContents)).toBe("pregnancy_day_contents");
    expect(getTableName(pregnancyWeekMedia)).toBe("pregnancy_week_media");
    expect(getTableName(weekChecklists)).toBe("week_checklists");
    expect(getTableName(weekQuestions)).toBe("week_questions");

    expect(pregnancyDayContents).toHaveProperty("weekDataId");
    expect(pregnancyWeekMedia).toHaveProperty("weekDataId");
    expect(weekChecklists).toHaveProperty("weekDataId");
    expect(weekQuestions).toHaveProperty("weekDataId");
  });
});
