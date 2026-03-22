import AdminOperationsPage from "@/components/AdminOperationsPage";

import { loadAdminPageData } from "../_lib/load-admin-page-data";

export default async function AdminOperationsRoute() {
  const { admin, dashboard } = await loadAdminPageData();

  return (
    <AdminOperationsPage
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
    />
  );
}
