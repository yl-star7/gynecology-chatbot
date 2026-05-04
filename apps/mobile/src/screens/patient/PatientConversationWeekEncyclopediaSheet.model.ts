import type { MobilePregnancyWeekSummary } from "@gynecology-chatbot/app-core";
import { buildWeeklyEncyclopediaViewModel } from "./PatientWeeklyEncyclopediaScreen.model.ts";

export type ConversationWeekEncyclopediaSheetSection = {
  title: string;
  body?: string | null;
  items?: string[];
};

export function buildConversationWeekEncyclopediaSheetModel(input: {
  weeks: MobilePregnancyWeekSummary[];
  profilePregnancyWeekLabel?: string | null;
  isLoading: boolean;
  errorMessage?: string | null;
}) {
  if (
    input.isLoading &&
    (!input.profilePregnancyWeekLabel || input.weeks.length === 0)
  ) {
    return {
      title: "임신백과를 불러오는 중이에요",
      subtitle: "잠시만 기다려주세요.",
      selectedWeekNumber: null,
      emptyTitle: null,
      emptyDescription: null,
      sections: [] as ConversationWeekEncyclopediaSheetSection[],
    };
  }

  if (input.errorMessage && input.weeks.length === 0) {
    return {
      title: "임신백과를 불러오지 못했어요",
      subtitle: input.errorMessage,
      selectedWeekNumber: null,
      emptyTitle: "다시 시도해주세요.",
      emptyDescription: input.errorMessage,
      sections: [] as ConversationWeekEncyclopediaSheetSection[],
    };
  }

  const weeklyModel = buildWeeklyEncyclopediaViewModel({
    weeks: input.weeks,
    profilePregnancyWeekLabel: input.profilePregnancyWeekLabel,
    selectedWeekNumber: null,
  });
  const selectedWeek = weeklyModel.selectedWeek;

  if (!selectedWeek) {
    return {
      title: "임신백과",
      subtitle: "주차별 정보를 차분히 살펴봐요.",
      selectedWeekNumber: null,
      emptyTitle: weeklyModel.emptyTitle,
      emptyDescription: weeklyModel.emptyDescription,
      sections: [] as ConversationWeekEncyclopediaSheetSection[],
    };
  }

  const sections: ConversationWeekEncyclopediaSheetSection[] = [
    {
      title: "태아 발달",
      body:
        selectedWeek.babySummary ?? "이 주차의 태아 발달 정보는 정리 중이에요.",
    },
    {
      title: "엄마 몸 변화",
      body:
        selectedWeek.motherSummary ?? "이 주차의 몸 변화 정보는 정리 중이에요.",
    },
  ];

  if (
    weeklyModel.lifeGuideSummary ||
    weeklyModel.lifeGuideBody ||
    weeklyModel.lifeGuideItems.length > 0
  ) {
    sections.push({
      title: weeklyModel.lifeGuideTitle,
      body: [weeklyModel.lifeGuideSummary, weeklyModel.lifeGuideBody]
        .filter(Boolean)
        .join("\n\n"),
      items: weeklyModel.lifeGuideItems,
    });
  }

  if (
    weeklyModel.cautionSummary ||
    weeklyModel.cautionBody ||
    weeklyModel.cautionItems.length > 0
  ) {
    sections.push({
      title: weeklyModel.cautionTitle,
      body: [weeklyModel.cautionSummary, weeklyModel.cautionBody]
        .filter(Boolean)
        .join("\n\n"),
      items: weeklyModel.cautionItems,
    });
  }

  if (
    selectedWeek.reflectionQuestion?.summary ||
    selectedWeek.reflectionQuestion?.body ||
    selectedWeek.reflectionQuestion?.items?.length
  ) {
    sections.push({
      title: selectedWeek.reflectionQuestion.title ?? "생각해볼 질문",
      body: [
        selectedWeek.reflectionQuestion.summary,
        selectedWeek.reflectionQuestion.body,
      ]
        .filter(Boolean)
        .join("\n\n"),
      items:
        selectedWeek.reflectionQuestion.items
          ?.map((item) => (typeof item === "string" ? item : null))
          .filter((item): item is string => Boolean(item)) ?? [],
    });
  }

  if (weeklyModel.faqItems.length > 0) {
    sections.push({
      title: weeklyModel.faqTitle,
      items: weeklyModel.faqItems.map(
        (item) => `${item.question} ${item.answer}`,
      ),
    });
  }

  return {
    title: weeklyModel.heroTitle,
    subtitle: weeklyModel.heroSubtitle,
    selectedWeekNumber: selectedWeek.weekNumber,
    emptyTitle: null,
    emptyDescription: null,
    sections,
  };
}

export type ConversationWeekEncyclopediaSheetModel = ReturnType<
  typeof buildConversationWeekEncyclopediaSheetModel
>;
