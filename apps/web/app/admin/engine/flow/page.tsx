import { AdminEngineIntegratedView } from "@/components/admin/engine/AdminEngineIntegratedView";
import type { MoodVariantItem } from "@/components/admin/engine/AdminMoodVariantsSection";
import { fetchAdminApiJson } from "@/lib/admin/api-server";

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

export default async function AdminEngineFlowRoute() {
  const { admin } = await loadAdminPageData();
  const initialMoodItems = await loadInitialMoodVariants(admin);

  return (
    <AdminEngineIntegratedView
      adminDisplayName={admin.displayName}
      initialMoodItems={initialMoodItems}
    />
  );
}
