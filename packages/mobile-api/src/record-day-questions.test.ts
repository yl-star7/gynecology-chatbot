import {
  buildDailyQuestionSummaries,
  groupDailyQuestionSummariesBySession,
  QUESTION_SUMMARY_PREPARING_COPY,
} from "./record-day-questions";

describe("buildDailyQuestionSummaries", () => {
  const question = {
    id: "q1",
    question_text: "오늘 아기에게 들려주고 싶은 말은?",
    day_number: 1,
  };

  it("keeps answered attachment summaries pending until the AI cron summary exists", () => {
    expect(
      buildDailyQuestionSummaries({
        datedQuestionRows: [question],
        genericQuestionRows: [],
        records: [
          {
            entry_type: "question_summary",
            title: question.question_text,
            summary: "질문 답변 대기 (q1)",
            payload: {
              source: "attachment_question_followup",
              questionId: "q1",
              answer: "엄마는 오늘 네가 건강하게 자라줘서 고마웠어.",
              compactSummary: "현재 단계: 질문 답변 대기 (q1)",
            },
          },
        ],
        deferUnfinalizedToToday: true,
      }),
    ).toEqual([
      {
        id: "q1",
        question: question.question_text,
        answerSummary: QUESTION_SUMMARY_PREPARING_COPY,
      },
    ]);
  });

  it("does not expose short raw question answers before the AI cron summary exists", () => {
    const result = buildDailyQuestionSummaries({
      datedQuestionRows: [
        {
          id: "q1",
          question_text: "아기에게 사랑을 키우는 방법을 알려주세요.",
          day_number: 1,
        },
        {
          id: "q2",
          question_text: "사랑을 줄 때와 받을 때 중 언제 더 행복한가요?",
          day_number: 1,
        },
      ],
      genericQuestionRows: [],
      records: [
        {
          entry_type: "survey_response",
          title: "아기에게 사랑을 키우는 방법을 알려주세요.",
          summary: "나도 잘 모르겠네",
          payload: { questionId: "q1", answer: "나도 잘 모르겠네" },
        },
        {
          entry_type: "survey_response",
          title: "사랑을 줄 때와 받을 때 중 언제 더 행복한가요?",
          summary: "줄때",
          payload: { questionId: "q2", answer: "줄때" },
        },
      ],
    });

    expect(result.map((item) => item.answerSummary)).toEqual([
      QUESTION_SUMMARY_PREPARING_COPY,
      QUESTION_SUMMARY_PREPARING_COPY,
    ]);
  });

  it("marks unanswered pending questions as waiting instead of dropping them", () => {
    expect(
      buildDailyQuestionSummaries({
        datedQuestionRows: [question],
        genericQuestionRows: [],
        records: [
          {
            entry_type: "question_summary",
            title: question.question_text,
            summary: "질문 답변 대기 (q1)",
            payload: {
              source: "attachment_question_followup",
              questionId: "q1",
              compactSummary: "현재 단계: 질문 답변 대기 (q1)",
            },
          },
        ],
        deferUnfinalizedToToday: true,
      })[0]?.answerSummary,
    ).toBe("답변을 기다리고 있어요.");
  });

  it("does not treat the selected question text as an answer", () => {
    expect(
      buildDailyQuestionSummaries({
        datedQuestionRows: [question],
        genericQuestionRows: [],
        records: [
          {
            entry_type: "question_summary",
            title: question.question_text,
            summary: "질문 답변 대기 (q1)",
            payload: {
              source: "attachment_question_followup",
              questionId: "q1",
              answer: question.question_text,
              compactSummary: "현재 단계: 질문 답변 대기 (q1)",
            },
          },
        ],
      })[0]?.answerSummary,
    ).toBe("답변을 기다리고 있어요.");
  });

  it("keeps a survey response pending when an older pending summary has no answer", () => {
    expect(
      buildDailyQuestionSummaries({
        datedQuestionRows: [question],
        genericQuestionRows: [],
        records: [
          {
            entry_type: "question_summary",
            title: question.question_text,
            summary: "질문 답변 대기 (q1)",
            payload: {
              source: "attachment_question_followup",
              questionId: "q1",
              compactSummary: "현재 단계: 질문 답변 대기 (q1)",
            },
          },
          {
            entry_type: "survey_response",
            title: question.question_text,
            summary: "마음이 아플 때는 잠깐 쉬어도 괜찮다고 말해주고 싶어요.",
            payload: {
              questionId: "q1",
              answer: "마음이 아플 때는 잠깐 쉬어도 괜찮다고 말해주고 싶어요.",
            },
          },
        ],
      })[0]?.answerSummary,
    ).toBe(QUESTION_SUMMARY_PREPARING_COPY);
  });

  it("keeps a survey response pending when a midnight placeholder is still stored", () => {
    expect(
      buildDailyQuestionSummaries({
        datedQuestionRows: [question],
        genericQuestionRows: [],
        records: [
          {
            entry_type: "question_summary",
            title: question.question_text,
            summary: "오늘 자정에 요약이 준비됩니다.",
            payload: {
              questionId: "q1",
              question: question.question_text,
            },
          },
          {
            entry_type: "survey_response",
            title: question.question_text,
            summary: "아기를 만나기 위해 몸과 마음을 준비하고 있어요.",
            payload: {
              questionId: "q1",
              answer: "아기를 만나기 위해 몸과 마음을 준비하고 있어요.",
            },
          },
        ],
      })[0]?.answerSummary,
    ).toBe(QUESTION_SUMMARY_PREPARING_COPY);
  });

  it("marks a chat-saved prompted question as waiting when no answer exists yet", () => {
    expect(
      buildDailyQuestionSummaries({
        datedQuestionRows: [question],
        genericQuestionRows: [],
        records: [
          {
            entry_type: "chat_saved",
            title: question.question_text.slice(0, 40),
            summary: "질문 답변 대기 (q1)",
            payload: {
              compactSummary: "현재 단계: 질문 답변 대기 (q1)",
              assistantSummary: `**"${question.question_text}"** 이 질문에 대해 편안하게 답해주세요.`,
            },
          },
        ],
      })[0]?.answerSummary,
    ).toBe("답변을 기다리고 있어요.");
  });

  it("groups answered question summaries from the same session into one calendar item", () => {
    const secondQuestion = {
      id: "q2",
      question_text: "오늘 몸에게 해주고 싶은 말은?",
      day_number: 1,
    };
    const dailyQuestions = buildDailyQuestionSummaries({
      datedQuestionRows: [question, secondQuestion],
      genericQuestionRows: [],
      records: [
        {
          entry_type: "question_summary",
          session_id: "session-1",
          title: question.question_text,
          summary:
            "아기에게 건강하게 자라줘서 고맙다는 마음을 전했어요. 오늘의 애정을 차분히 표현하려고 했어요.",
          payload: {
            source: "daily_question_summary",
            questionId: "q1",
            question: question.question_text,
          },
        },
        {
          entry_type: "question_summary",
          session_id: "session-1",
          title: secondQuestion.question_text,
          summary:
            "몸에게 오늘도 잘 견뎌줘서 고맙다는 말을 건넸어요. 버텨낸 하루를 다정하게 인정하려고 했어요.",
          payload: {
            source: "daily_question_summary",
            questionId: "q2",
            question: secondQuestion.question_text,
          },
        },
      ],
    });

    expect(
      groupDailyQuestionSummariesBySession({
        dailyQuestions,
        records: [
          {
            entry_type: "question_summary",
            session_id: "session-1",
            title: question.question_text,
            summary:
              "아기에게 건강하게 자라줘서 고맙다는 마음을 전했어요. 오늘의 애정을 차분히 표현하려고 했어요.",
            payload: { questionId: "q1" },
          },
          {
            entry_type: "question_summary",
            session_id: "session-1",
            title: secondQuestion.question_text,
            summary:
              "몸에게 오늘도 잘 견뎌줘서 고맙다는 말을 건넸어요. 버텨낸 하루를 다정하게 인정하려고 했어요.",
            payload: { questionId: "q2" },
          },
        ],
      }),
    ).toEqual([
      {
        id: "session-question-group:session-1",
        question: "오늘 나눈 질문 2개",
        answerSummary:
          "1. 아기에게 건강하게 자라줘서 고맙다는 마음을 전했어요. 오늘의 애정을 차분히 표현하려고 했어요.\n2. 몸에게 오늘도 잘 견뎌줘서 고맙다는 말을 건넸어요. 버텨낸 하루를 다정하게 인정하려고 했어요.",
      },
    ]);
  });

  it("keeps unanswered waiting questions separate when grouping session answers", () => {
    const waitingQuestion = {
      id: "q2",
      question_text: "오늘 몸에게 해주고 싶은 말은?",
      day_number: 1,
    };
    const dailyQuestions = [
      {
        id: "q1",
        question: question.question_text,
        answerSummary: "아기에게 건강하게 자라줘서 고맙다고 남겼어요.",
      },
      {
        id: "q2",
        question: waitingQuestion.question_text,
        answerSummary: "답변을 기다리고 있어요.",
      },
      {
        id: "q3",
        question: "오늘 마음을 한 단어로 표현하면?",
        answerSummary: "조금 불안하지만 기대도 된다고 남겼어요.",
      },
    ];

    expect(
      groupDailyQuestionSummariesBySession({
        dailyQuestions,
        records: [
          {
            entry_type: "question_summary",
            session_id: "session-1",
            title: question.question_text,
            summary: dailyQuestions[0].answerSummary,
            payload: { questionId: "q1" },
          },
          {
            entry_type: "question_summary",
            session_id: "session-1",
            title: dailyQuestions[2].question,
            summary: dailyQuestions[2].answerSummary,
            payload: { questionId: "q3" },
          },
        ],
      }),
    ).toEqual([
      {
        id: "session-question-group:session-1",
        question: "오늘 나눈 질문 2개",
        answerSummary:
          "1. 아기에게 건강하게 자라줘서 고맙다고 남겼어요.\n2. 조금 불안하지만 기대도 된다고 남겼어요.",
      },
      {
        id: "q2",
        question: waitingQuestion.question_text,
        answerSummary: "답변을 기다리고 있어요.",
      },
    ]);
  });
});
