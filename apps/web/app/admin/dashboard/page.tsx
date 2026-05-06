import AdminDashboard from "@/components/AdminDashboard";

import { loadAdminPageData } from "../_lib/load-admin-page-data";

export default async function AdminDashboardRoute() {
  const { admin, dashboard } = await loadAdminPageData();

  return (
    <AdminDashboard
      dashboard={dashboard}
      adminDisplayName={admin.displayName}
    />
  );
}
