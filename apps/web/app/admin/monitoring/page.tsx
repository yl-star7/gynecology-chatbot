import AdminMonitoringPage from "@/components/AdminMonitoringPage";

import { loadAdminPageData } from "../_lib/load-admin-page-data";

export default async function AdminMonitoringRoute() {
  const { admin, dashboard } = await loadAdminPageData();

  return (
    <AdminMonitoringPage
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
    />
  );
}
