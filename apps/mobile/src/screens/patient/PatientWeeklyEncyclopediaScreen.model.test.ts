import assert from "node:assert/strict";
import test from "node:test";
import type { MobilePregnancyWeekSummary } from "@gynecology-chatbot/app-core";
import {
  buildWeeklyEncyclopediaViewModel,
  resolveWeeklyEncyclopediaSelectedWeek,
} from "./PatientWeeklyEncyclopediaScreen.model.ts";

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
      body: "생활 본문",
      items: ["물 마시기", "가볍게 산책하기"],
    },
    caution: {
      title: "주의할 점",
      summary: "불편함이 심하면 상담해요.",
      body: "주의 본문",
      items: ["강한 통증"],
    },
    faq: {
      title: "궁금해요",
      items: [
        { question: "배 모양이 달라도 괜찮나요?", answer: "개인차가 있어요." },
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

test("weekly encyclopedia selects the profile week when it is ready", () => {
  const model = buildWeeklyEncyclopediaViewModel({
    weeks,
    profilePregnancyWeekLabel: "18주 2일",
    selectedWeekNumber: null,
  });

  assert.equal(model.selectedWeek?.weekNumber, 18);
  assert.equal(model.heroTitle, "18주차");
  assert.equal(model.heroSubtitle, "아기는 고구마만큼 자라고 있어요.");
  assert.deepEqual(model.lifeGuideItems, ["물 마시기", "가볍게 산책하기"]);
  assert.deepEqual(model.cautionItems, ["강한 통증"]);
  assert.equal(model.faqItems[0]?.question, "배 모양이 달라도 괜찮나요?");
  assert.equal(
    model.weekCells.find((cell) => cell.weekNumber === 18)?.state,
    "current",
  );
  assert.equal(
    model.weekCells.find((cell) => cell.weekNumber === 19)?.state,
    "preparing",
  );
});

test("weekly encyclopedia honors a selected ready week", () => {
  assert.equal(
    resolveWeeklyEncyclopediaSelectedWeek({
      weeks,
      profilePregnancyWeekLabel: "18주 2일",
      selectedWeekNumber: 20,
    })?.weekNumber,
    20,
  );

  const model = buildWeeklyEncyclopediaViewModel({
    weeks,
    profilePregnancyWeekLabel: "18주 2일",
    selectedWeekNumber: 20,
  });

  assert.equal(model.selectedWeek?.weekNumber, 20);
  assert.equal(
    model.weekCells.find((cell) => cell.weekNumber === 20)?.state,
    "selected",
  );
  assert.equal(
    model.weekCells.find((cell) => cell.weekNumber === 18)?.state,
    "current",
  );
});

test("weekly encyclopedia exposes a preparing state for missing weeks", () => {
  const model = buildWeeklyEncyclopediaViewModel({
    weeks,
    profilePregnancyWeekLabel: "18주 2일",
    selectedWeekNumber: 36,
  });

  assert.equal(model.selectedWeek, null);
  assert.equal(model.preparingWeekNumber, 36);
  assert.equal(model.emptyTitle, "36주차 정보는 정리 중이에요");
  assert.equal(
    model.emptyDescription,
    "준비되는 대로 차분히 읽을 수 있게 보여드릴게요.",
  );
});
