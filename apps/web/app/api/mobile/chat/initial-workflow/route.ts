import { NextRequest, NextResponse } from "next/server";
import { createInitialWorkflowMessageFromPrompt } from "@gynecology-chatbot/mobile-api/chat/initial-workflow-message";
import { parseChatFlowConfig } from "@gynecology-chatbot/mobile-api/chat/chat-flow-config";
import { loadMaternalNursingWorkflow } from "@gynecology-chatbot/mobile-api/workflows/load-workflow-yaml";
import {
  isMobileSessionError,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

export async function GET(request: NextRequest) {
  try {
    await requireMobileSession(request);
    const workflowDef = loadMaternalNursingWorkflow();
    const chatFlowConfig = parseChatFlowConfig({
      chatFlow: workflowDef.chatFlow,
      prompts: workflowDef.prompts,
    });
    const message = createInitialWorkflowMessageFromPrompt(
      JSON.stringify({
        scenario: "mood_intake",
        promptText: chatFlowConfig.moodIntake.promptText,
        directInputAcknowledgementText:
          chatFlowConfig.moodIntake.directInputAcknowledgementText,
        moodPrompts: chatFlowConfig.moodIntake.moodPrompts,
      }),
    );

    return NextResponse.json(
      { message },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (error) {
    if (isMobileSessionError(error)) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "초기 대화 정보를 불러오지 못했어요." },
      { status: 500 },
    );
  }
}
