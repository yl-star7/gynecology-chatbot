import { rewriteLetterReflectionQuickReplies } from "./letter-reflection-postprocess";

describe("rewriteLetterReflectionQuickReplies", () => {
  it("appends remaining count to '다음 질문' label", () => {
    const payload = {
      quickReplies: [
        { label: "하나 더 나누기", message: "하나 더 이야기하고 싶어요." },
        { label: "다음 질문으로", message: "다음 질문으로 이어갈래요." },
      ],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: ["q1"],
      currentAttachmentQuestionId: "q2",
    });
    const next = out.quickReplies!.find((q) => q.label.includes("다음 질문"));
    expect(next?.label).toBe("다음 질문으로 (1개 남음)");
  });

  it("shows 2 remaining when first question is in progress", () => {
    const payload = {
      quickReplies: [
        { label: "하나 더 나누기", message: "." },
        { label: "다음 질문으로", message: "." },
      ],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: "q1",
    });
    expect(out.quickReplies![1].label).toBe("다음 질문으로 (2개 남음)");
  });

  it("replaces with 자유대화 when quota exhausted", () => {
    const payload = {
      quickReplies: [
        { label: "하나 더 나누기", message: "." },
        { label: "다음 질문으로", message: "." },
      ],
    };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: ["q1", "q2"],
      currentAttachmentQuestionId: "q3",
    });
    const next = out.quickReplies![1];
    expect(next.label).toBe("자유대화로");
    expect(next.message).toContain("자유롭게");
  });

  it("ensures both buttons exist even if LLM drops one", () => {
    const payload = { quickReplies: [] };
    const out = rewriteLetterReflectionQuickReplies(payload, {
      answeredQuestionIds: [],
      currentAttachmentQuestionId: "q1",
    });
    expect(out.quickReplies).toHaveLength(2);
    expect(out.quickReplies![0].label).toBe("하나 더 나누기");
  });
});
