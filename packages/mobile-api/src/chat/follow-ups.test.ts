import { buildPromptFollowUpMessages } from "./follow-ups";

describe("buildPromptFollowUpMessages", () => {
  it("keeps document-style question choices up to five replies", async () => {
    const result = await buildPromptFollowUpMessages({
      week: {
        id: "week-20",
        week_number: 20,
        title: "20주차",
        baby_summary: null,
        mother_summary: null,
        warning_signs: null,
        recommended_actions: null,
        checklist_intro: null,
        question_intro: "오늘 기분을 알려주세요",
        status: "published",
      },
      dayContent: null,
      checklists: [],
      questions: [
        {
          id: "emotion-question",
          code: "emotion_checkin",
          question_text: "오늘 기분이 어떠세요?",
          question_type: "single_choice",
          help_text: null,
          question_payload: {
            choices: [
              { label: "좋아요" },
              { label: "우울해요" },
              { label: "슬퍼요" },
              { label: "화나요" },
              { label: "직접 입력" },
              { label: "초과" },
            ],
          },
          display_order: 1,
          is_required: true,
        },
      ],
    });

    const quickReplies = result.messages[0]?.parts.find(
      (part) => part.type === "quickReplies",
    );

    expect(quickReplies?.type).toBe("quickReplies");
    if (quickReplies?.type !== "quickReplies") {
      throw new Error("quick replies part was not created");
    }

    expect(quickReplies?.choices.map((choice) => choice.label)).toEqual([
      "좋아요",
      "우울해요",
      "슬퍼요",
      "화나요",
      "직접 입력",
    ]);
  });

  it("does not create checklist follow-ups when no question is available", async () => {
    const result = await buildPromptFollowUpMessages({
      week: {
        id: "week-20",
        week_number: 20,
        title: "20주차",
        baby_summary: null,
        mother_summary: null,
        warning_signs: null,
        recommended_actions: null,
        checklist_intro: "오늘 할 일",
        question_intro: null,
        status: "published",
      },
      dayContent: null,
      checklists: [
        {
          id: "check-1",
          code: "water",
          title: "수분 섭취 체크",
          description: "물을 충분히 마셨는지 확인해 주세요.",
          checklist_payload: null,
          display_order: 1,
          is_required: true,
        },
      ],
      questions: [],
    });

    expect(result.messages).toEqual([]);
    expect(result.selectedChecklists).toEqual([]);
    expect(result.selectedQuestions).toEqual([]);
  });
});
