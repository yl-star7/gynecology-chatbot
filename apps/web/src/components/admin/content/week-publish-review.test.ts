import type { AdminWeekDetail } from "@gynecology-chatbot/app-core";

import {
  getWeekPublishDayStatus,
  getWeekPublishReview,
} from "./week-publish-review";

function createWeekDetail(
  overrides: Partial<AdminWeekDetail> = {},
): AdminWeekDetail {
  return {
    id: "week-1",
    weekNumber: 1,
    title: "1주차 기본",
    babySizeLabel: "참깨",
    babySizeCompareObject: "참깨 한 알",
    babySummary: "작은 변화가 시작됩니다.",
    motherSummary: "몸의 변화를 느낄 수 있습니다.",
    heroImagePath: null,
    compareImagePath: null,
    status: "draft",
    updatedAt: "2026-03-18T00:00:00.000Z",
    days: [
      {
        id: "day-1",
        dayNumber: 1,
        title: "Day 1",
        babyDevelopmentItems: ["아기 변화"],
        babyMessage: "안녕",
        motherChangesItems: ["엄마 변화"],
        displayOrder: 1,
      },
    ],
    sections: [
      {
        id: "section-1",
        dayNumber: 1,
        sectionKey: "check-1",
        title: "체크리스트",
        body: "본문",
        displayOrder: 1,
        isRequired: true,
        isActive: true,
      },
    ],
    assets: [
      {
        id: "asset-1",
        dayNumber: 1,
        assetType: "question",
        storagePath: "질문",
        altText: null,
        styleKey: "question-1",
        displayOrder: 1,
        isRequired: true,
        isActive: true,
      },
    ],
    media: [],
    ...overrides,
  };
}

describe("week publish review", () => {
  it("marks a day partial when checklist content is incomplete", () => {
    const week = createWeekDetail({
      sections: [
        {
          id: "section-1",
          dayNumber: 1,
          sectionKey: "check-1",
          title: "체크리스트",
          body: "   ",
          displayOrder: 1,
          isRequired: true,
          isActive: true,
        },
      ],
    });

    expect(getWeekPublishDayStatus(week, 1)).toBe("partial");
  });

  it("includes missing days in the publish review", () => {
    const week = createWeekDetail();

    expect(getWeekPublishReview(week).missingItems).toEqual(
      expect.arrayContaining(["Day 2", "Day 7"]),
    );
  });
});
