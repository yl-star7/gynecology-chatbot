import AdminMoodVariantsSection, {
  type MoodVariantFallbackItem,
  type MoodVariantItem,
} from "@/components/admin/engine/AdminMoodVariantsSection";
import { fetchAdminApiJson } from "@/lib/admin/api-server";
import { MOOD_VARIANT_MOODS } from "@/lib/admin/mood-variants-constants";
import { parseChatFlowConfig } from "@gynecology-chatbot/mobile-api/chat/chat-flow-config";
import {
  loadMaternalNursingWorkflow,
  loadMaternalNursingWorkflowPreferRemote,
} from "@gynecology-chatbot/mobile-api/workflows/load-workflow-yaml";

import { loadAdminPageData } from "../../_lib/load-admin-page-data";

async function loadInitialMoodVariants(admin: {
  id: string;
}): Promise<MoodVariantItem[]> {
  try {
    const { items } = await fetchAdminApiJson<{ items: MoodVariantItem[] }>(
      "engine/moods",
      { admin },
    );
    return items;
  } catch {
    return [];
  }
}

async function loadMoodVariantFallbacks(): Promise<MoodVariantFallbackItem[]> {
  try {
    let workflow;
    try {
      workflow = await loadMaternalNursingWorkflowPreferRemote();
    } catch {
      workflow = loadMaternalNursingWorkflow();
    }
    const chatFlowConfig = parseChatFlowConfig({
      chatFlow: workflow.chatFlow,
      prompts: workflow.prompts,
    });
    const allowedMoods = new Set<string>(
      MOOD_VARIANT_MOODS.map((mood) => mood.value),
    );

    return Object.entries(
      chatFlowConfig.moodIntake.acknowledgementsByTone,
    ).flatMap(([mood, lines]) => {
      if (!allowedMoods.has(mood)) {
        return [];
      }
      if (!lines || lines.length === 0) {
        return [];
      }
      return [
        {
          scenario: "mood_intake",
          mood,
          prompt_suffix: lines.join("\n"),
        },
      ];
    });
  } catch {
    return [];
  }
}

export default async function AdminEngineMoodsRoute() {
  const { admin, dashboard } = await loadAdminPageData();
  const [initialItems, initialFallbackItems] = await Promise.all([
    loadInitialMoodVariants(admin),
    loadMoodVariantFallbacks(),
  ]);

  return (
    <AdminMoodVariantsSection
      adminDisplayName={admin.displayName}
      initialItems={initialItems}
      initialFallbackItems={initialFallbackItems}
      dashboard={dashboard}
    />
  );
}
