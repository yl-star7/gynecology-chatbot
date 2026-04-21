import {
  selectStageWorkflow,
  type StageWorkflowMapping,
} from "./stage-workflow-selector";

const mapping: StageWorkflowMapping = {
  baby_info: "wf-baby",
  letter_reflection: "wf-letter",
  free_chat: "wf-free",
  general: "wf-general",
};

describe("selectStageWorkflow", () => {
  it("picks free_chat when stage=free_chat", () => {
    const sel = selectStageWorkflow(
      {
        query: "아기 이름 짓기",
        workflowStage: "free_chat",
        currentAttachmentQuestionId: null,
        lastScenario: null,
        compactSummary: null,
      },
      mapping,
    );
    expect(sel?.key).toBe("free_chat");
    expect(sel?.workflowId).toBe("wf-free");
  });

  it("picks letter_reflection when stage=2 with currentAttachmentQuestionId", () => {
    const sel = selectStageWorkflow(
      {
        query: "엄마는 네가 소중해",
        workflowStage: 2,
        currentAttachmentQuestionId: "q1",
        lastScenario: "attachment_question",
        compactSummary: "현재 단계: 질문 답변 중",
      },
      mapping,
    );
    expect(sel?.key).toBe("letter_reflection");
  });

  it("picks baby_info at stage=0 Y path (positive ack + baby_info_offer context)", () => {
    const sel = selectStageWorkflow(
      {
        query: "네, 오늘 주차 정보 볼래요.",
        workflowStage: 0,
        currentAttachmentQuestionId: null,
        lastScenario: "baby_info_offer",
        compactSummary: "현재 단계: 태아 발달 확인 제안",
      },
      mapping,
    );
    expect(sel?.key).toBe("baby_info");
  });

  it("falls back to general when no specific match", () => {
    const sel = selectStageWorkflow(
      {
        query: "몸이 아파요",
        workflowStage: 0,
        currentAttachmentQuestionId: null,
        lastScenario: null,
        compactSummary: null,
      },
      mapping,
    );
    expect(sel?.key).toBe("general");
  });

  it("does not pick baby_info if no Y-path context", () => {
    const sel = selectStageWorkflow(
      {
        query: "네, 볼래요.",
        workflowStage: 0,
        currentAttachmentQuestionId: null,
        lastScenario: null,
        compactSummary: null,
      },
      mapping,
    );
    expect(sel?.key).toBe("general");
  });

  it("returns null if all mapping keys are null", () => {
    const sel = selectStageWorkflow(
      {
        query: "x",
        workflowStage: 0,
        currentAttachmentQuestionId: null,
        lastScenario: null,
        compactSummary: null,
      },
      {
        baby_info: null,
        letter_reflection: null,
        free_chat: null,
        general: null,
      },
    );
    expect(sel).toBeNull();
  });
});
