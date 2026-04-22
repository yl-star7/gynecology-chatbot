import { requireAdminSession } from "@/lib/admin/auth";
import { fetchAdminApiJson } from "@/lib/admin/api-server";
import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

export async function loadAdminPageData() {
  const admin = await requireAdminSession();
  const { dashboard } = await fetchAdminApiJson<{
    dashboard: AdminDashboardData;
  }>("dashboard", { admin });

  return {
    admin,
    dashboard,
  };
}
