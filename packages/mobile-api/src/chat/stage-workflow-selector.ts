/**
 * 현재 턴의 input + progress + memory 를 보고 호출할 Schift subworkflow ID 를 고른다.
 *
 * 분기 우선순위:
 *   1. stage='free_chat' → free_chat workflow
 *   2. stage=2 + currentAttachmentQuestionId → letter_reflection
 *   3. stage=0 + 사용자가 주차 정보 긍정 답변 ("네, 볼래요" etc.) → baby_info
 *   4. 그 외 → general (기본 라우트)
 *
 * 매핑은 DB system_config('workflow_stage_mapping') 또는 env 변수.
 * 라우트가 이 값을 전달.
 */

export type StageWorkflowMapping = {
  baby_info: string | null;
  letter_reflection: string | null;
  free_chat: string | null;
  general: string | null;
};

export type StageWorkflowSelectionInput = {
  query: string;
  workflowStage: string | number | null | undefined;
  currentAttachmentQuestionId: string | null;
  lastScenario: string | null;
  compactSummary: string | null;
};

export type StageWorkflowSelection = {
  key: keyof StageWorkflowMapping;
  workflowId: string;
  reason: string;
};

const YES_PATTERN =
  /(^|\s)(네|응|예|좋아|알려|보여|볼래요|볼래|궁금|확인할래요)/;

export function selectStageWorkflow(
  input: StageWorkflowSelectionInput,
  mapping: StageWorkflowMapping,
): StageWorkflowSelection | null {
  const stage = input.workflowStage;
  const stageStr = String(stage ?? "");

  // 1) free_chat
  if (stage === "free_chat" || stageStr === "free_chat") {
    const id = mapping.free_chat;
    if (id) {
      return { key: "free_chat", workflowId: id, reason: "stage=free_chat" };
    }
  }

  // 2) stage=2 + 질문 대화 진행 중
  if ((stage === 2 || stageStr === "2") && input.currentAttachmentQuestionId) {
    const id = mapping.letter_reflection;
    if (id) {
      return {
        key: "letter_reflection",
        workflowId: id,
        reason: `stage=2 currentQ=${input.currentAttachmentQuestionId}`,
      };
    }
  }

  // 3) stage=0 Y path — 주차 정보 긍정 답변
  const isYPathContext =
    (stage === 0 || stageStr === "0") &&
    (input.lastScenario === "baby_info_offer" ||
      (input.compactSummary ?? "").includes("태아 발달 확인 제안"));
  if (isYPathContext && YES_PATTERN.test(input.query)) {
    const id = mapping.baby_info;
    if (id) {
      return {
        key: "baby_info",
        workflowId: id,
        reason: "stage=0 Y path (positive ack)",
      };
    }
  }

  // 4) 기본 라우트
  const id = mapping.general;
  if (id) {
    return { key: "general", workflowId: id, reason: "default_general" };
  }
  return null;
}
