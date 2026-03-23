import { requireAdminSession } from "@/lib/admin/auth";
import { loadCachedAdminDashboard } from "@/lib/admin/admin-cache";

export async function loadAdminPageData() {
  const admin = await requireAdminSession();
  const dashboard = await loadCachedAdminDashboard();

  return {
    admin,
    dashboard,
  };
}
