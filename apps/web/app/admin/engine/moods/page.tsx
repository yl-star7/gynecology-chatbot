import AdminMoodVariantsSection, {
  type MoodVariantItem,
} from "@/components/admin/engine/AdminMoodVariantsSection";
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

export default async function AdminEngineMoodsRoute() {
  const { admin, dashboard } = await loadAdminPageData();
  const initialItems = await loadInitialMoodVariants(admin);

  return (
    <AdminMoodVariantsSection
      adminDisplayName={admin.displayName}
      initialItems={initialItems}
      dashboard={dashboard}
    />
  );
}
