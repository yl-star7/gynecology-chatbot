import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import AdminMonitoringPage from "@/components/AdminMonitoringPage";
import { fetchAdminApiJson } from "@/lib/admin/api-server";
import { requireAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminOpsMonitoringRoute() {
  const admin = await requireAdminSession();
  const { dashboard } = await fetchAdminApiJson<{
    dashboard: AdminDashboardData;
  }>("dashboard", { admin });

  return (
    <AdminMonitoringPage
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
    />
  );
}
