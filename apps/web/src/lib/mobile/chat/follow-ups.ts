import type { ChatMessage } from "@gynecology-chatbot/app-core";
import type {
  ChecklistRow,
  DayContentRow,
  QuestionRow,
  WeekDataRow,
} from "@/lib/mobile/chat/chat-repository";
import { sanitizeInlineCitationMarkers } from "@/lib/mobile/chat/sanitizers";

type AssistantFollowUpMessage = {
  role: "assistant";
  createdAtLabel: string;
  parts: ChatMessage["parts"];
};

type DayContentLike = DayContentRow | null;

export type PromptFollowUpResult = {
  messages: AssistantFollowUpMessage[];
  selectedChecklists: ChecklistRow[];
  selectedQuestions: QuestionRow[];
};

export type ChecklistChoice = { label: string; message: string };

export type ChecklistChoicesGenerator = (input: {
  checklistId: string;
  checklistCode: string;
  title: string;
  description: string;
  weekNumber: number | null;
}) => Promise<ChecklistChoice[] | null>;

const DEFAULT_CHECKLIST_CHOICES: ChecklistChoice[] = [
  { label: "했어요", message: "했어요" },
  { label: "안 했어요", message: "안 했어요" },
  { label: "왜 해야 하나요?", message: "왜 해야 하나요?" },
];

function buildQuickReplyChoices(input: {
  baseId: string;
  options: Array<string | { label: string; message: string }>;
}) {
  return input.options.slice(0, 5).map((option, index) => ({
    id: `${input.baseId}-choice-${index + 1}`,
    label: typeof option === "string" ? option : option.label,
    message: typeof option === "string" ? option : option.message,
  }));
}

export async function buildPromptFollowUpMessages(input: {
  week: WeekDataRow;
  dayContent: DayContentLike;
  checklists: ChecklistRow[];
  questions: QuestionRow[];
  excludeChecklistIds?: Set<string>;
  excludeQuestionIds?: Set<string>;
  generateChecklistChoices?: ChecklistChoicesGenerator;
}): Promise<PromptFollowUpResult> {
  const messages: AssistantFollowUpMessage[] = [];
  const selectedChecklists: ChecklistRow[] = [];
  const selectedQuestions: QuestionRow[] = [];

  const availableChecklists = input.checklists.filter(
    (c) => !input.excludeChecklistIds?.has(c.id),
  );
  const availableQuestions = input.questions.filter(
    (q) => !input.excludeQuestionIds?.has(q.id),
  );

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

      let choices: ChecklistChoice[] = DEFAULT_CHECKLIST_CHOICES;
      if (input.generateChecklistChoices) {
        try {
          const generated = await input.generateChecklistChoices({
            checklistId: checklist.id,
            checklistCode: checklist.code,
            title: cleanTitle,
            description: cleanDesc,
            weekNumber: input.week.week_number ?? null,
          });
          if (generated && generated.length > 0) {
            choices = generated.slice(0, 5);
          }
        } catch {
          // fall back to defaults silently
        }
      }

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
              options: choices,
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
      const escapedQ = qText
        .slice(0, 30)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text.replace(
        new RegExp(`(?:^|\\n)[-–""]?\\s*${escapedQ}[^\\n]*`, "g"),
        "",
      );
    }

    text = text.replace(
      /(?:^|\n)오늘 할 일\s*\n?(?=\s*$|\n오늘 할 일|\n생각해볼)/g,
      "",
    );
    text = text.replace(
      /(?:^|\n)생각해볼 질문\s*\n?(?=\s*$|\n생각해볼|\n오늘 할 일)/g,
      "",
    );
    text = text.replace(/\n{3,}/g, "\n\n").trim();

    return { ...part, text };
  });
}
