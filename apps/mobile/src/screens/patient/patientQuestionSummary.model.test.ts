import assert from "node:assert/strict";
import test from "node:test";
import {
  formatQuestionAnswerSummary,
  isPendingQuestionAnswerSummary,
  resolveQuestionAnswerSummary,
} from "./patientQuestionSummary.model.ts";

test("resolveQuestionAnswerSummary hides workflow state labels", () => {
  assert.equal(
    resolveQuestionAnswerSummary(
      "질문 답변 대기 (a5d93e8b-02e8-428d-8ea8-c5ef9569691c)",
    ),
    null,
  );
  assert.equal(
    formatQuestionAnswerSummary("현재 단계: 오늘의 질문 준비"),
    "아직 답변하지 않았어요.",
  );
  assert.equal(
    formatQuestionAnswerSummary("오늘 자정에 요약이 준비됩니다."),
    "아직 답변하지 않았어요.",
  );
});

test("resolveQuestionAnswerSummary keeps real answer text", () => {
  assert.equal(
    resolveQuestionAnswerSummary("  오늘은 아기에게 고맙다고 말하고 싶어요.  "),
    "오늘은 아기에게 고맙다고 말하고 싶어요.",
  );
});

test("isPendingQuestionAnswerSummary detects answer-in-progress state", () => {
  assert.equal(isPendingQuestionAnswerSummary("현재 단계: 질문 답변 중"), true);
});
