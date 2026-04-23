import { rewriteLetterReflectionQuickReplies } from "./letter-reflection-postprocess";

describe("rewriteLetterReflectionQuickReplies", () => {
  it("appends remaining count to '다른 질문도 볼래요' label", () => {
    const payload = {
      quickReplies: [
        { label: "조금 더 말할래요", message: "하나 더 이야기하고 싶어요." },
        { label: "다른 질문도 볼래요", message: "다음 질문으로 이어갈래요." },
      ],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: ["q1"],
      currentAttachmentQuestionId: "q2",
    });
    const next = out.quickReplies!.find((q) => q.label.includes("다른 질문"));
    expect(next?.label).toBe("다른 질문도 볼래요 (1개)");
  });

  it("shows 2 remaining when first question is in progress", () => {
    const payload = {
      quickReplies: [
        { label: "조금 더 말할래요", message: "." },
        { label: "다른 질문도 볼래요", message: "." },
      ],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: "q1",
    });
    expect(out.quickReplies![2].label).toBe("다른 질문도 볼래요 (2개)");
  });

  it("replaces with 자유대화 when quota exhausted", () => {
    const payload = {
      quickReplies: [
        { label: "조금 더 말할래요", message: "." },
        { label: "다른 질문도 볼래요", message: "." },
      ],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: ["q1", "q2"],
      currentAttachmentQuestionId: "q3",
    });
    const next = out.quickReplies![2];
    expect(next.label).toBe("자유대화로");
    expect(next.message).toContain("자유롭게");
  });

  it("ensures all buttons exist even if LLM drops them", () => {
    const payload = { quickReplies: [] };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: "q1",
    });
    expect(out.quickReplies).toHaveLength(3);
    expect(out.quickReplies![0].label).toBe("조금 더 이야기할래요");
  });
});
