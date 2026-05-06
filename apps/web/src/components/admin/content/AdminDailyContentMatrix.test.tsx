import { fireEvent, render, screen } from "@testing-library/react";
import type { AdminWeekDetail } from "@gynecology-chatbot/app-core";

import { AdminDailyContentMatrix } from "./AdminDailyContentMatrix";

function createWeek(): AdminWeekDetail {
  return {
    id: "week-6",
    weekNumber: 6,
    title: "6주차",
    babySizeLabel: null,
    babySizeCompareObject: null,
    babySummary: "요약",
    motherSummary: "요약",
    heroImagePath: null,
    compareImagePath: null,
    status: "draft",
    updatedAt: "2026-03-18T00:00:00.000Z",
    days: [
      {
        id: "day-1",
        dayNumber: 1,
        title: "Day 1",
        babyDevelopmentItems: ["심장이 뛰기 시작해요."],
        babyMessage: "엄마, 안녕하세요.",
        motherChangesItems: ["피로감을 느낄 수 있어요."],
        displayOrder: 1,
      },
    ],
    sections: [
      {
        id: "section-1",
        dayNumber: 1,
        sectionKey: "check-1",
        title: "수분을 충분히 마셔요.",
        body: "",
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
        storagePath: "오늘 몸에게 해주고 싶은 말은 무엇인가요?",
        altText: null,
        styleKey: "question-1",
        displayOrder: 1,
        isRequired: true,
        isActive: true,
      },
    ],
    media: [],
  };
}

describe("AdminDailyContentMatrix", () => {
  it("filters daily content by content column", () => {
    render(<AdminDailyContentMatrix weeks={[createWeek()]} />);

    const babyMessage = screen.getByText("아기의 말: 엄마, 안녕하세요.");
    const babyDevelopment = screen.getByText("아기 발달: 심장이 뛰기 시작해요.");
    expect(
      babyMessage.compareDocumentPosition(babyDevelopment) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("아기 발달: 심장이 뛰기 시작해요.")).toBeVisible();
    expect(screen.getByText("수분을 충분히 마셔요.")).toBeVisible();
    expect(
      screen.getByText("오늘 몸에게 해주고 싶은 말은 무엇인가요?"),
    ).toBeVisible();

    fireEvent.change(screen.getByLabelText("컬럼"), {
      target: { value: "questions" },
    });

    expect(
      screen.getByText("오늘 몸에게 해주고 싶은 말은 무엇인가요?"),
    ).toBeVisible();
    expect(screen.queryByText("수분을 충분히 마셔요.")).not.toBeInTheDocument();
    expect(
      screen.queryByText("아기 발달: 심장이 뛰기 시작해요."),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("컬럼"), {
      target: { value: "checklists" },
    });

    expect(screen.getByText("수분을 충분히 마셔요.")).toBeVisible();
    expect(
      screen.queryByText("오늘 몸에게 해주고 싶은 말은 무엇인가요?"),
    ).not.toBeInTheDocument();
  });

  it("uses the same day count that the mobile app displays", () => {
    const week = createWeek();
    week.id = "week-28";
    week.weekNumber = 28;
    week.title = "28주차";
    week.days[0] = {
      ...week.days[0]!,
      id: "day-2",
      dayNumber: 2,
      title: "Day 2",
      displayOrder: 2,
    };
    week.sections[0] = { ...week.sections[0]!, dayNumber: 2 };
    week.assets[0] = { ...week.assets[0]!, dayNumber: 2 };

    render(<AdminDailyContentMatrix weeks={[week]} />);

    expect(screen.queryByText("2일차")).not.toBeInTheDocument();
    expect(screen.getByText("28주 1일")).toBeVisible();
    expect(screen.getByText("197")).toBeVisible();
  });
});
