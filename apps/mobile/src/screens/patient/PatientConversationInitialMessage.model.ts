import type { ChatMessage } from "@gynecology-chatbot/app-core";

export function createInitialConversationMessage(): ChatMessage {
  return {
    id: "assistant-initial-workflow",
    role: "assistant",
    createdAtLabel: "방금 전",
    characterTone: "calm",
    parts: [
      {
        type: "text",
        id: "initial-workflow-text",
        text: "오늘은 마음이 어떠세요?\n\n편하게 하나만 골라도 좋고, 직접 말해줘도 괜찮아요.",
      },
      {
        type: "quickReplies",
        id: "initial-workflow-quick",
        choices: [
          {
            id: "initial-workflow-good",
            label: "좋아요",
            message: "오늘 기분이 좋아요.",
            moodTone: "joyful",
          },
          {
            id: "initial-workflow-down",
            label: "우울해요",
            message: "기분이 울적해요.",
            moodTone: "sad",
          },
          {
            id: "initial-workflow-sad",
            label: "슬퍼요",
            message: "오늘은 마음이 슬퍼요.",
            moodTone: "sad",
          },
          {
            id: "initial-workflow-angry",
            label: "화나요",
            message: "오늘은 조금 짜증이 나요.",
            moodTone: "anxious",
          },
          {
            id: "initial-workflow-direct",
            label: "직접 입력",
            message: "직접 말하고 싶어요.",
          },
        ],
      },
    ],
  };
}
