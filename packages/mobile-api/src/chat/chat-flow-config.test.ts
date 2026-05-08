import { loadMaternalNursingWorkflow } from "../workflows/load-workflow-yaml";
import { parseChatFlowConfig } from "./chat-flow-config";

describe("chat flow config", () => {
  const originalGcsWorkflowBucket = process.env.GCS_WORKFLOW_BUCKET;
  const originalGcsProjectId = process.env.GCS_PROJECT_ID;
  const originalGoogleCloudProject = process.env.GOOGLE_CLOUD_PROJECT;
  const originalGoogleApplicationCredentials =
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  beforeEach(() => {
    delete process.env.GCS_WORKFLOW_BUCKET;
    delete process.env.GCS_PROJECT_ID;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  });

  afterAll(() => {
    if (originalGcsWorkflowBucket !== undefined) {
      process.env.GCS_WORKFLOW_BUCKET = originalGcsWorkflowBucket;
    }
    if (originalGcsProjectId !== undefined) {
      process.env.GCS_PROJECT_ID = originalGcsProjectId;
    }
    if (originalGoogleCloudProject !== undefined) {
      process.env.GOOGLE_CLOUD_PROJECT = originalGoogleCloudProject;
    }
    if (originalGoogleApplicationCredentials !== undefined) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS =
        originalGoogleApplicationCredentials;
    }
  });

  it("loads deterministic chat stages and data source declarations from YAML", () => {
    const workflow = loadMaternalNursingWorkflow();
    const config = parseChatFlowConfig({
      chatFlow: workflow.chatFlow,
      prompts: workflow.prompts,
    });

    expect(config.dataSources.map((source) => source.key)).toEqual(
      expect.arrayContaining([
        "pregnancy_profile",
        "today_questions",
        "question_progress",
        "session_memory",
        "recent_history",
      ]),
    );
    expect(
      config.moodIntake.moodPrompts.slice(0, 5).map((item) => item.label),
    ).toEqual([
      "좋아요",
      "우울해요",
      "슬퍼요",
      "화나요",
      "직접 말하고 싶어요",
    ]);
    expect(config.moodIntake.directInputAcknowledgementText).toBe(
      "오늘의 기분 나눠줘서 고마워요. 잘 기억해서 차근차근 더 이야기 해볼게요.",
    );
    expect(config.weekInfoOptIn.quickReplies.no).toEqual({
      id: "week-info-no",
      label: "아니요",
      message: "아니요, 태교 질문으로 넘어갈게요.",
    });
    expect(config.todayQuestion.blockedText).toBe(
      "얘기해주셔서 감사해요. 😊\n오늘의 태교 질문에 먼저 답해주시면, 이후에는 편안한 자유 대화로 이어갈 수 있어요.",
    );
    expect(config.questionSelected.answerTemplate).toContain(
      "{{questionText}}",
    );
    expect(config.questionAnswer.reflectionLoop).toMatchObject({
      minUserTurnsBeforeNext: 3,
      maxUserTurnsPerQuestion: 5,
      quickReplyMode: "hidden",
      nextQuestionLabelTemplate: "다른 질문도 볼래요 ({{remainingCount}}개)",
      nextQuestionMessage: "다음 질문으로 이어갈래요.",
    });
    expect(config.freeChatIntro.quickReplies.map((item) => item.id)).toEqual([
      "free-chat-topic-body",
      "free-chat-topic-feeling",
      "end-session",
    ]);
  });

  it("falls back to legacy prompt JSON when chat_flow is absent", () => {
    const config = parseChatFlowConfig({
      prompts: {
        static_mood_intake: JSON.stringify({
          scenario: "mood_intake",
          promptText: "기분을 골라주세요.",
          directInputAcknowledgementText: "고마워요.",
          moodPrompts: [
            { label: "좋아요", message: "좋아요.", tone: "joyful" },
          ],
        }),
        static_week_info_opt_in: JSON.stringify({
          answerVariations: ["주차 정보 볼까요?"],
        }),
      },
    });

    expect(config.moodIntake.promptText).toBe("기분을 골라주세요.");
    expect(config.moodIntake.directInputAcknowledgementText).toBe("고마워요.");
    expect(config.moodIntake.moodPrompts).toEqual([
      { label: "좋아요", message: "오늘은 좋은 기분이에요.", tone: "joyful" },
    ]);
    expect(config.weekInfoOptIn.answerVariations).toEqual([
      "주차 정보 볼까요?",
    ]);
    expect(config.questionAnswer.reflectionLoop).toMatchObject({
      minUserTurnsBeforeNext: 3,
      maxUserTurnsPerQuestion: 5,
    });
  });
});
