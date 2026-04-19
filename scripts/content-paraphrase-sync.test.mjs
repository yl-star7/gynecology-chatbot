import assert from "node:assert/strict";
import test from "node:test";
import {
  buildParaphraseRows,
  buildParaphraseSql,
  estimateGeminiFlashLiteCostUsd,
} from "./content-paraphrase-sync.mjs";

const artifact = {
  model: "gemini-3.1-flash-lite-preview",
  usageMetadata: {
    promptTokenCount: 1000,
    candidatesTokenCount: 2000,
    totalTokenCount: 3000,
  },
  output: {
    week_number: 19,
    status: "needs_review",
    paraphrased_title: "19주차: 아기의 특별한 무늬",
    paraphrased_summary: "아기의 지문이 완성되는 시기예요.",
    sections: {
      baby_development: {
        title: "아기 성장 이야기",
        summary: "아기의 지문이 완성돼요.",
        body: ["아기는 약 24~25cm예요."],
        bullets: ["지문이 완성돼요."],
      },
      mother_body: {
        title: "엄마 몸 변화",
        summary: "배가 더 둥글게 보여요.",
        body: "자궁이 배꼽 근처까지 올라와요.",
        bullets: [],
      },
    },
    checklist_items: [
      {
        dayNumber: 1,
        sourceText: "원본 체크",
        paraphrasedText: "바꾼 체크",
      },
    ],
    reflection_questions: [
      {
        dayNumber: 1,
        sourceText: "원본 질문",
        paraphrasedText: "바꾼 질문",
      },
    ],
  },
};

test("estimates Gemini Flash Lite cost from usage metadata", () => {
  assert.equal(estimateGeminiFlashLiteCostUsd(artifact.usageMetadata), 0.0009);
});

test("buildParaphraseRows maps Gemini output to run and item rows", () => {
  const rows = buildParaphraseRows(artifact, {
    promptVersion: "weekly-encyclopedia-v1",
  });

  assert.equal(rows.run.model, "gemini-3.1-flash-lite-preview");
  assert.equal(rows.run.promptVersion, "weekly-encyclopedia-v1");
  assert.equal(rows.run.targetWeekNumber, 19);
  assert.equal(rows.run.status, "completed");
  assert.equal(rows.items.length, 5);
  assert.deepEqual(
    rows.items.map((item) => [item.contentScope, item.category]),
    [
      ["week_summary", "overview"],
      ["section", "baby_development"],
      ["section", "mother_body"],
      ["checklist", "life_guide"],
      ["question", "reflection_question"],
    ],
  );
  assert.equal(rows.items[0]?.status, "needs_review");
  assert.equal(rows.items[0]?.isActive, false);
  assert.ok(rows.items[0]?.sourceHash);
});

test("buildParaphraseSql emits insert SQL for run and items", () => {
  const sql = buildParaphraseSql(artifact, {
    promptVersion: "weekly-encyclopedia-v1",
  });

  assert.match(sql, /INSERT INTO public\.content_paraphrase_runs/);
  assert.match(sql, /INSERT INTO public\.content_paraphrased_items/);
  assert.match(sql, /'needs_review'/);
  assert.match(sql, /'week_summary'/);
  assert.match(sql, /'reflection_question'/);
});
