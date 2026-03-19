import {
  extractImagePlacements,
  getStorageObjectPath,
  groupImagePlacementsByScope,
  parsePregnancyWeekDocText,
} from "./pregnancy-docx-import";

describe("parsePregnancyWeekDocText", () => {
  it("parses week/day sections and strips citation markers", () => {
    const parsed = parsePregnancyWeekDocText(`
13주차_7일간
✅ Day 1
① 태아 발달 정보
• 아기의 크기는 레몬만큼, 약 7.4cm / 81g이에요.(1)(2)
👶 아기의 말: “이제 레몬만큼 커졌어요.(2)”
② 모체 변화 정보
• 입덧과 피로가 완화되며, 기운이 조금씩 돌아오기 시작해요. (1),(3)
③ 생활 체크리스트
• 오늘 체중을 기록했나요?
• 산전검진 일정을 확인했나요?(1)
④ 태교 질문
• “오늘은 감사에 대해 엄마의 생각을 들려주세요.”
• “감사를 느끼는 이유는 무엇인가요?”

✅ Day 2
① 태아 발달 정보
• 손목과 발목도 만들어집니다.(1)(2)(3)
👶 아기의 말: “엄마, 손목과 발목도 생겼어요”
② 모체 변화 정보
• 코막힘, 속쓰림이 생길 수 있어요.(1)
③ 생활 체크리스트
• 코막힘 시 실내 공기 습도 유지하기
④ 태교 질문
• “오늘은 어떤 모습을 닮았으면 좋겠나요?”

14주차_7일간
✅ Day 1
① 태아 발달 정보
• 아기의 길이는 약 8~9cm예요. (1)(2)
👶 아기의 말: “엄마의 심장까지 조금씩 올라가고 싶어요.”
② 모체 변화 정보
• 아랫배가 살짝 볼록해질 수 있어요. (2)
③ 생활 체크리스트
• 오늘 하루동안 수시로 옆으로 누워 휴식하는 연습을 해보세요.
④ 태교 질문
• “함께 자라는 느낌을 느끼나요?”
`);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      weekNumber: 13,
      title: "13주차",
    });
    expect(parsed[0].days).toHaveLength(2);
    expect(parsed[0].days[0]).toEqual({
      dayNumber: 1,
      babyDevelopment: ["아기의 크기는 레몬만큼, 약 7.4cm / 81g이에요."],
      babyMessage: "이제 레몬만큼 커졌어요.",
      motherChanges: ["입덧과 피로가 완화되며, 기운이 조금씩 돌아오기 시작해요."],
      checklistItems: ["오늘 체중을 기록했나요?", "산전검진 일정을 확인했나요?"],
      questions: [
        "오늘은 감사에 대해 엄마의 생각을 들려주세요.",
        "감사를 느끼는 이유는 무엇인가요?",
      ],
    });
    expect(parsed[1].days[0].babyDevelopment).toEqual([
      "아기의 길이는 약 8~9cm예요.",
    ]);
  });

  it("ignores stray repeated day headings after the seventh day", () => {
    const parsed = parsePregnancyWeekDocText(`
35주차_7일간
✅ Day 1
① 태아 발달 정보
• day1
✅ Day 2
① 태아 발달 정보
• day2
✅ Day 3
① 태아 발달 정보
• day3
✅ Day 4
① 태아 발달 정보
• day4
✅ Day 5
① 태아 발달 정보
• day5
✅ Day 6
① 태아 발달 정보
• day6
✅ Day 7
① 태아 발달 정보
• day7

부록
✅ Day 1
① 태아 발달 정보
• appendix noise
`);

    expect(parsed[0].days).toHaveLength(7);
    expect(parsed[0].days[6].babyDevelopment).toEqual(["day7"]);
  });
});

describe("extractImagePlacements", () => {
  it("assigns embedded images to the current week/day context", () => {
    const placements = extractImagePlacements(
      `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
        xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <w:body>
          <w:p><w:r><w:t>13주차_7일간</w:t></w:r></w:p>
          <w:p><w:r><w:t>✅ Day 1</w:t></w:r></w:p>
          <w:p><w:r><a:blip r:embed="rId1" /></w:r></w:p>
          <w:p><w:r><w:t>✅ Day 2</w:t></w:r></w:p>
          <w:p><w:r><a:blip r:embed="rId2" /></w:r></w:p>
        </w:body>
      </w:document>
      `,
      `
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Target="media/image1.png" />
        <Relationship Id="rId2" Target="media/image2.png" />
      </Relationships>
      `,
    );

    expect(placements).toEqual([
      {
        weekNumber: 13,
        dayNumber: 1,
        target: "media/image1.png",
        order: 1,
      },
      {
        weekNumber: 13,
        dayNumber: 2,
        target: "media/image2.png",
        order: 2,
      },
    ]);
  });
});

describe("groupImagePlacementsByScope", () => {
  it("collapses day-7-only images into weekly media groups", () => {
    const grouped = groupImagePlacementsByScope([
      { weekNumber: 15, dayNumber: 7, target: "media/image1.png", order: 1 },
      { weekNumber: 15, dayNumber: 7, target: "media/image2.png", order: 2 },
      { weekNumber: 16, dayNumber: 3, target: "media/image3.png", order: 3 },
    ]);

    expect(grouped).toEqual([
      {
        weekNumber: 15,
        dayNumber: null,
        scope: "week",
        placements: [
          { weekNumber: 15, dayNumber: 7, target: "media/image1.png", order: 1 },
          { weekNumber: 15, dayNumber: 7, target: "media/image2.png", order: 2 },
        ],
      },
      {
        weekNumber: 16,
        dayNumber: 3,
        scope: "day",
        placements: [
          { weekNumber: 16, dayNumber: 3, target: "media/image3.png", order: 3 },
        ],
      },
    ]);
  });
});

describe("getStorageObjectPath", () => {
  it("builds weekly media paths as weeks/<week>/<id>", () => {
    expect(
      getStorageObjectPath({
        weekNumber: 15,
        scope: "week",
        order: 1,
        sourceName: "image1.png",
      }),
    ).toBe("weeks/15/001-image1.png");
  });

  it("resets the weekly media index per week", () => {
    expect(
      getStorageObjectPath({
        weekNumber: 35,
        scope: "week",
        order: 1,
        sourceName: "image75.png",
      }),
    ).toBe("weeks/35/001-image75.png");
  });

  it("builds day-scoped media paths under the day folder", () => {
    expect(
      getStorageObjectPath({
        weekNumber: 16,
        dayNumber: 3,
        scope: "day",
        order: 12,
        sourceName: "image 12.png",
      }),
    ).toBe("weeks/16/day-03/012-image-12.png");
  });
});
