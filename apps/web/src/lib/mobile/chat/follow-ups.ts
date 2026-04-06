import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { sanitizeInlineCitationMarkers } from "@/lib/mobile/chat/sanitizers";

type WeekDataLike = {
  week_number: number;
  checklist_intro: string | null;
  question_intro: string | null;
};

type DayContentLike = {
  day_number: number;
  baby_message: string | null;
} | null;

type ChecklistLike = {
  id: string;
  code: string;
  title: string;
  description: string | null;
};

type QuestionLike = {
  id: string;
  code: string;
  question_text: string;
  question_type: "text" | "single_choice" | "multi_choice" | "yes_no" | "number";
  help_text: string | null;
  question_payload: {
    choices?: Array<{ id?: string; label?: string }>;
    yesLabel?: string;
    noLabel?: string;
  } | null;
};

type AssistantFollowUpMessage = {
  role: "assistant";
  createdAtLabel: string;
  parts: ChatMessage["parts"];
};

export type PromptFollowUpResult = {
  messages: AssistantFollowUpMessage[];
  selectedChecklists: ChecklistLike[];
  selectedQuestions: QuestionLike[];
};

function buildQuickReplyChoices(input: { baseId: string; options: string[] }) {
  return input.options.slice(0, 4).map((option, index) => ({
    id: `${input.baseId}-choice-${index + 1}`,
    label: option,
    message: option,
  }));
}

export function buildPromptFollowUpMessages(input: {
  week: WeekDataLike;
  dayContent: DayContentLike;
  checklists: ChecklistLike[];
  questions: QuestionLike[];
  excludeChecklistIds?: Set<string>;
  excludeQuestionIds?: Set<string>;
}): PromptFollowUpResult {
  const messages: AssistantFollowUpMessage[] = [];
  const selectedChecklists: ChecklistLike[] = [];
  const selectedQuestions: QuestionLike[] = [];

  const availableChecklists = input.checklists.filter(
    (c) => !input.excludeChecklistIds?.has(c.id),
  );
  const availableQuestions = input.questions.filter(
    (q) => !input.excludeQuestionIds?.has(q.id),
  );

  if (input.dayContent?.baby_message?.trim()) {
    messages.push({
      role: "assistant",
      createdAtLabel: "방금 전",
      parts: [
        {
          type: "text",
          id: `baby-message-${input.week.week_number}-${input.dayContent.day_number}`,
          text: input.dayContent.baby_message.trim(),
        },
      ],
    });
  }

  const question = availableQuestions[0];
  if (question) {
    selectedQuestions.push(question);
    const questionChoices =
      question.question_type === "yes_no"
        ? [
            question.question_payload?.yesLabel?.trim() || "네",
            question.question_payload?.noLabel?.trim() || "아니요",
          ]
        : (question.question_payload?.choices ?? [])
            .map((choice) => choice.label?.trim() ?? "")
            .filter(Boolean);

    const fallbackChoices =
      questionChoices.length > 0
        ? questionChoices
        : ["괜찮아요", "조금 걱정돼요", "더 확인하고 싶어요", "잘 모르겠어요"];

    messages.push({
      role: "assistant",
      createdAtLabel: "방금 전",
      parts: [
        {
          type: "text",
          id: `question-text-${question.id}`,
          tag: "question",
          contentId: question.id,
          contentCode: question.code,
          text: sanitizeInlineCitationMarkers(
            [
              input.week.question_intro ?? "생각해볼 질문",
              question.question_text,
              question.help_text,
            ]
              .filter(Boolean)
              .join("\n"),
          ),
        },
        {
          type: "quickReplies",
          id: `quick-replies-question-${question.id}`,
          tag: "question",
          contentId: question.id,
          contentCode: question.code,
          title: "빠르게 답해보세요",
          choices: buildQuickReplyChoices({
            baseId: question.id,
            options: fallbackChoices,
          }),
        },
      ],
    });
  } else {
    const checklist = availableChecklists[0];
    if (checklist) {
      selectedChecklists.push(checklist);
      const cleanTitle = sanitizeInlineCitationMarkers(checklist.title);
      const cleanDesc = checklist.description
        ? sanitizeInlineCitationMarkers(checklist.description)
        : "";
      const descText =
        cleanDesc && cleanDesc !== cleanTitle ? `\n${cleanDesc}` : "";
      const shortLabel =
        cleanTitle.length > 30 ? cleanTitle.slice(0, 30) + "…" : cleanTitle;

      messages.push({
        role: "assistant",
        createdAtLabel: "방금 전",
        parts: [
          {
            type: "text",
            id: `checklist-${checklist.id}`,
            tag: "checklist",
            contentId: checklist.id,
            contentCode: checklist.code,
            text: `${input.week.checklist_intro ?? "오늘 할 일"}\n${cleanTitle}${descText}`,
          },
          {
            type: "quickReplies",
            id: `quick-replies-checklist-${checklist.id}`,
            tag: "checklist",
            contentId: checklist.id,
            contentCode: checklist.code,
            title: "빠르게 답해보세요",
            choices: buildQuickReplyChoices({
              baseId: checklist.id,
              options: [
                `${shortLabel} 했어요`,
                `${shortLabel} 아직 못 했어요`,
                `${shortLabel} 더 설명해 주세요`,
              ],
            }),
          },
        ],
      });
    }
  }

  return { messages, selectedChecklists, selectedQuestions };
}

export function stripFollowUpContentFromAnswer(
  parts: ChatMessage["parts"],
  promptContext: {
    checklists: { title: string }[];
    questions: { question_text: string }[];
  },
): ChatMessage["parts"] {
  const checklistTitles = promptContext.checklists.map((c) => c.title);
  const questionTexts = promptContext.questions.map((q) => q.question_text);

  return parts.map((part) => {
    if (part.type !== "text") return part;

    let text = part.text;

    for (const title of checklistTitles) {
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text.replace(
        new RegExp(
          `(?:^|\\n)[-–]?\\s*${escapedTitle}[^\\n]*(?:\\n${escapedTitle}[^\\n]*)?`,
          "g",
        ),
        "",
      );
    }

    for (const qText of questionTexts) {
      const escapedQ = qText.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text.replace(
        new RegExp(`(?:^|\\n)[-–""]?\\s*${escapedQ}[^\\n]*`, "g"),
        "",
      );
    }

    text = text.replace(/(?:^|\n)오늘 할 일\s*\n?(?=\s*$|\n오늘 할 일|\n생각해볼)/g, "");
    text = text.replace(/(?:^|\n)생각해볼 질문\s*\n?(?=\s*$|\n생각해볼|\n오늘 할 일)/g, "");
    text = text.replace(/\n{3,}/g, "\n\n").trim();

    return { ...part, text };
  });
}
