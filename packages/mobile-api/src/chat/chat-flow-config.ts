import {
  DIRECT_INPUT_MOOD_ACKNOWLEDGEMENT_TEXT,
  normalizeInitialMoodPrompts,
  parseInitialMoodIntakeConfig,
  type InitialMoodPrompt,
} from "./initial-workflow-message";
import {
  normalizeLetterReflectionLoopPolicy,
  type LetterReflectionLoopPolicy,
} from "./letter-reflection-postprocess";
import type { CharacterTone } from "./workflow-payload";

export type ChatFlowQuickReply = {
  id: string;
  label: string;
  message: string;
};

export type ChatFlowDataSource = {
  key: string;
  source: string;
  table?: string;
  view?: string;
  fields: string[];
  usedBy: string[];
  description?: string;
};

export type ChatFlowConfig = {
  dataSources: ChatFlowDataSource[];
  moodIntake: {
    promptText: string;
    directInputAcknowledgementText: string;
    moodPrompts: InitialMoodPrompt[];
    acknowledgementsByTone: Partial<Record<CharacterTone, string[]>>;
  };
  weekInfoOptIn: {
    answerVariations: string[];
    quickReplies: {
      yes: ChatFlowQuickReply;
      no: ChatFlowQuickReply;
    };
  };
  todayQuestion: {
    promptText: string;
    blockedText: string;
    deferredWeekInfoText: string;
    compactSummaryTemplate: string;
  };
  questionSelected: {
    answerTemplate: string;
  };
  activeQuestionRequired: {
    answerTemplate: string;
  };
  questionAnswer: {
    reflectionLoop: LetterReflectionLoopPolicy;
  };
  exhaustedChoice: {
    answerText: string;
  };
  freeChatIntro: {
    answerText: string;
    quickReplies: ChatFlowQuickReply[];
  };
  ended: {
    answerText: string;
  };
};

const DEFAULT_WEEK_INFO_OPT_IN_VARIATIONS = [
  "오늘 주차의 산모/태아 정보가 궁금하세요?",
];

export const REQUIRED_TODAY_QUESTION_NOTICE_TEXT =
  "얘기해주셔서 감사해요. 😊\n오늘의 태교 질문에 먼저 답해주시면, 이후에는 편안한 자유 대화로 이어갈 수 있어요.";

export const ACTIVE_QUESTION_REQUIRED_TEMPLATE = `${REQUIRED_TODAY_QUESTION_NOTICE_TEXT}\n\n**"{{questionText}}"**`;

const DEFAULT_ACKNOWLEDGEMENTS: Record<CharacterTone, string[]> = {
  joyful: ["좋은 마음이 느껴져서 저도 반가워요."],
  sad: ["울적한 마음을 꺼내줘서 고마워요."],
  anxious: ["마음이 조금 긴장되어 있었군요."],
  tired: ["몸과 마음이 많이 지친 날이군요."],
  calm: ["차분하게 지금 마음을 살펴보고 계시군요."],
};

const DEFAULT_QUICK_REPLIES = {
  weekInfoYes: {
    id: "week-info-yes",
    label: "네",
    message: "네, 오늘 주차 정보 볼래요.",
  },
  weekInfoNo: {
    id: "week-info-no",
    label: "나중에요",
    message: "나중에 볼게요.",
  },
} satisfies Record<string, ChatFlowQuickReply>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function parseQuickReply(
  value: unknown,
  fallback: ChatFlowQuickReply,
): ChatFlowQuickReply {
  const record = asRecord(value);
  if (!record) return fallback;
  return {
    id: asString(record.id, fallback.id),
    label: asString(record.label, fallback.label),
    message: asString(record.message, fallback.message),
  };
}

function parseQuickReplyArray(
  value: unknown,
  fallback: ChatFlowQuickReply[],
): ChatFlowQuickReply[] {
  if (!Array.isArray(value)) return fallback;
  const parsed = value
    .map((item, index) =>
      parseQuickReply(item, fallback[index] ?? fallback[fallback.length - 1]!),
    )
    .filter((item) => item.id && item.label && item.message);
  return parsed.length > 0 ? parsed : fallback;
}

function parseMoodPrompts(
  value: unknown,
  fallback: InitialMoodPrompt[],
): InitialMoodPrompt[] {
  if (!Array.isArray(value)) return normalizeInitialMoodPrompts(fallback);
  const parsed = parseInitialMoodIntakeConfig(
    JSON.stringify({ scenario: "mood_intake", moodPrompts: value }),
  ).moodPrompts;
  return parsed.length > 0 ? parsed : normalizeInitialMoodPrompts(fallback);
}

function parseAcknowledgements(
  value: unknown,
): Partial<Record<CharacterTone, string[]>> {
  const record = asRecord(value);
  if (!record) return DEFAULT_ACKNOWLEDGEMENTS;
  const out: Partial<Record<CharacterTone, string[]>> = {};
  for (const tone of ["calm", "joyful", "anxious", "tired", "sad"] as const) {
    const items = asStringArray(record[tone], DEFAULT_ACKNOWLEDGEMENTS[tone]);
    if (items.length > 0) {
      out[tone] = items;
    }
  }
  return out;
}

function parseDataSources(value: unknown): ChatFlowDataSource[] {
  const record = asRecord(value);
  if (!record) return [];
  const out: ChatFlowDataSource[] = [];
  for (const [key, raw] of Object.entries(record)) {
    const item = asRecord(raw);
    if (!item) continue;
    const source: ChatFlowDataSource = {
      key,
      source: asString(item.source, "server"),
      fields: asStringArray(item.fields),
      usedBy: asStringArray(item.used_by ?? item.usedBy),
    };
    if (typeof item.table === "string" && item.table.trim()) {
      source.table = item.table.trim();
    }
    if (typeof item.view === "string" && item.view.trim()) {
      source.view = item.view.trim();
    }
    if (typeof item.description === "string" && item.description.trim()) {
      source.description = item.description.trim();
    }
    out.push(source);
  }
  return out;
}

function parsePromptJsonList(promptJson: string | undefined, key: string) {
  try {
    const parsed = JSON.parse(promptJson ?? "{}") as Record<string, unknown>;
    return asStringArray(parsed[key]);
  } catch {
    return [];
  }
}

export function parseChatFlowConfig(input: {
  chatFlow?: unknown;
  prompts: Record<string, string>;
}): ChatFlowConfig {
  const root = asRecord(input.chatFlow);
  const stages = asRecord(root?.stages) ?? {};
  const moodStage = asRecord(stages.mood_intake) ?? {};
  const weekInfoStage = asRecord(stages.week_info_opt_in) ?? {};
  const todayQuestionStage = asRecord(stages.today_question) ?? {};
  const questionSelectedStage = asRecord(stages.question_selected) ?? {};
  const questionAnswerStage =
    asRecord(stages.question_answer ?? stages.questionAnswer) ?? {};
  const reflectionLoopStage =
    asRecord(
      questionAnswerStage.reflection_loop ?? questionAnswerStage.reflectionLoop,
    ) ?? {};
  const exhaustedStage = asRecord(stages.exhausted_choice) ?? {};
  const freeChatStage = asRecord(stages.free_chat_intro) ?? {};
  const endedStage = asRecord(stages.ended) ?? {};
  const moodPromptFromPrompt = parseInitialMoodIntakeConfig(
    input.prompts.static_mood_intake,
  );
  const weekInfoVariationsFromPrompt = parsePromptJsonList(
    input.prompts.static_week_info_opt_in,
    "answerVariations",
  );

  return {
    dataSources: parseDataSources(root?.data_sources ?? root?.dataSources),
    moodIntake: {
      promptText: asString(
        moodStage.prompt_text ?? moodStage.promptText,
        moodPromptFromPrompt.promptText,
      ),
      directInputAcknowledgementText: DIRECT_INPUT_MOOD_ACKNOWLEDGEMENT_TEXT,
      moodPrompts: parseMoodPrompts(
        moodStage.options ?? moodStage.moodPrompts,
        moodPromptFromPrompt.moodPrompts,
      ),
      acknowledgementsByTone: parseAcknowledgements(
        moodStage.acknowledgements_by_tone ?? moodStage.acknowledgementsByTone,
      ),
    },
    weekInfoOptIn: {
      answerVariations: asStringArray(
        weekInfoStage.answer_variations ?? weekInfoStage.answerVariations,
        weekInfoVariationsFromPrompt.length > 0
          ? weekInfoVariationsFromPrompt
          : DEFAULT_WEEK_INFO_OPT_IN_VARIATIONS,
      ),
      quickReplies: {
        yes: parseQuickReply(
          asRecord(weekInfoStage.quick_replies)?.yes,
          DEFAULT_QUICK_REPLIES.weekInfoYes,
        ),
        no: parseQuickReply(
          asRecord(weekInfoStage.quick_replies)?.no,
          DEFAULT_QUICK_REPLIES.weekInfoNo,
        ),
      },
    },
    todayQuestion: {
      promptText: asString(
        todayQuestionStage.prompt_text ?? todayQuestionStage.promptText,
        "아래 질문 중 하나를 골라 이어가요.",
      ),
      blockedText: REQUIRED_TODAY_QUESTION_NOTICE_TEXT,
      deferredWeekInfoText: asString(
        todayQuestionStage.deferred_week_info_text ??
          todayQuestionStage.deferredWeekInfoText,
        "사전은 나중에 봐도 좋아요. 아래 질문 중 하나를 골라 이어가요.",
      ),
      compactSummaryTemplate: asString(
        todayQuestionStage.compact_summary_template ??
          todayQuestionStage.compactSummaryTemplate,
        "현재 단계: 모아애착 질문 ({{answeredCount}}/{{quota}} 답변 완료)",
      ),
    },
    questionSelected: {
      answerTemplate: asString(
        questionSelectedStage.answer_template ??
          questionSelectedStage.answerTemplate,
        '**"{{questionText}}"**\n\n이 질문에 대해 편안하게 답해주세요. 아기에게 들려주는 편지처럼 써도 좋고, 떠오르는 한 문장이어도 괜찮아요.',
      ),
    },
    activeQuestionRequired: {
      answerTemplate: ACTIVE_QUESTION_REQUIRED_TEMPLATE,
    },
    questionAnswer: {
      reflectionLoop: normalizeLetterReflectionLoopPolicy(reflectionLoopStage),
    },
    exhaustedChoice: {
      answerText: asString(
        exhaustedStage.answer_text ?? exhaustedStage.answerText,
        "오늘의 질문을 모두 답변하셨어요. 이제 자유롭게 얘기해보아요.",
      ),
    },
    freeChatIntro: {
      answerText: asString(
        freeChatStage.answer_text ?? freeChatStage.answerText,
        "편하게 이야기 이어갈게요. 오늘 나누고 싶은 이야기가 있으세요?",
      ),
      quickReplies: parseQuickReplyArray(
        freeChatStage.quick_replies ?? freeChatStage.quickReplies,
        [
          {
            id: "free-chat-topic-body",
            label: "몸 상태 이야기",
            message: "요즘 몸 상태가 어떤지 이야기하고 싶어요.",
          },
          {
            id: "free-chat-topic-feeling",
            label: "오늘 기분",
            message: "오늘 기분을 조금 더 나누고 싶어요.",
          },
          {
            id: "end-session",
            label: "여기까지 할래요",
            message: "오늘은 여기까지 할게요.",
          },
        ],
      ),
    },
    ended: {
      answerText: asString(
        endedStage.answer_text ?? endedStage.answerText,
        "오늘 이야기해줘서 고마워요. 또 만나요.",
      ),
    },
  };
}
