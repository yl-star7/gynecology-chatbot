import assert from "node:assert/strict";
import test from "node:test";
import type { MobilePregnancyWeekSummary } from "@gynecology-chatbot/app-core";
import { buildConversationWeekEncyclopediaSheetModel } from "./PatientConversationWeekEncyclopediaSheet.model.ts";

const weeks: MobilePregnancyWeekSummary[] = [
  {
    weekNumber: 18,
    title: "18주차",
    babySizeLabel: "고구마",
    babySummary: "아기가 활발히 움직여요.",
    motherSummary: "배가 조금씩 도드라져요.",
    lifeGuide: {
      title: "생활 가이드",
      summary: "물을 충분히 마셔요.",
      body: "가벼운 산책으로 몸을 풀어요.",
      items: ["물 마시기", "짧게 걷기"],
    },
    caution: {
      title: "주의할 점",
      summary: "통증이 강하면 상담해요.",
      items: ["강한 통증", "출혈"],
    },
    reflectionQuestion: {
      title: "생각해볼 질문",
      summary: "오늘 몸의 변화를 적어봐요.",
      body: "마음이 편했던 순간도 함께 남겨요.",
      items: ["오늘 가장 편했던 자세는 무엇인가요?"],
    },
    faq: {
      title: "궁금해요",
      items: [
        { question: "태동이 매일 같나요?", answer: "날마다 다를 수 있어요." },
      ],
    },
  },
  {
    weekNumber: 20,
    title: "20주차",
    babySizeLabel: "바나나",
    babySummary: "아기가 더 길어져요.",
    motherSummary: "몸의 균형이 달라질 수 있어요.",
  },
];

test("conversation week sheet selects the current profile week encyclopedia content", () => {
  const model = buildConversationWeekEncyclopediaSheetModel({
    weeks,
    profilePregnancyWeekLabel: "18주 2일",
    isLoading: false,
    errorMessage: null,
  });

  assert.equal(model.title, "18주차");
  assert.equal(model.subtitle, "아기는 고구마만큼 자라고 있어요.");
  assert.equal(model.emptyTitle, null);
  assert.deepEqual(
    model.sections.map((section) => section.title),
    [
      "태아 발달",
      "엄마 몸 변화",
      "생활 가이드",
      "주의할 점",
      "생각해볼 질문",
      "궁금해요",
    ],
  );
  assert.equal(model.sections[0]?.body, "아기가 활발히 움직여요.");
  assert.deepEqual(model.sections[2]?.items, ["물 마시기", "짧게 걷기"]);
  assert.equal(
    model.sections[5]?.items?.[0],
    "태동이 매일 같나요? 날마다 다를 수 있어요.",
  );
  assert.deepEqual(model.sections[4]?.items, [
    "오늘 가장 편했던 자세는 무엇인가요?",
  ]);
});

test("conversation week sheet exposes a loading state before encyclopedia content arrives", () => {
  const model = buildConversationWeekEncyclopediaSheetModel({
    weeks: [],
    profilePregnancyWeekLabel: null,
    isLoading: true,
    errorMessage: null,
  });

  assert.equal(model.title, "임신백과를 불러오는 중이에요");
  assert.equal(model.emptyTitle, null);
  assert.deepEqual(model.sections, []);
});

test("conversation week sheet keeps loading when weeks arrive before the profile week", () => {
  const model = buildConversationWeekEncyclopediaSheetModel({
    weeks,
    profilePregnancyWeekLabel: null,
    isLoading: true,
    errorMessage: null,
  });

  assert.equal(model.title, "임신백과를 불러오는 중이에요");
  assert.equal(model.selectedWeekNumber, null);
  assert.deepEqual(model.sections, []);
});

test("conversation week sheet shows a warm fallback when the current week is unavailable", () => {
  const model = buildConversationWeekEncyclopediaSheetModel({
    weeks: [],
    profilePregnancyWeekLabel: "19주 0일",
    isLoading: false,
    errorMessage: null,
  });

  assert.equal(model.title, "임신백과");
  assert.equal(model.emptyTitle, "이 주차 정보는 정리 중이에요");
  assert.equal(
    model.emptyDescription,
    "준비되는 대로 차분히 읽을 수 있게 보여드릴게요.",
  );
});
