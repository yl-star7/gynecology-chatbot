import AdminAccountsPage from "@/components/AdminAccountsPage";

import { loadAdminPageData } from "../_lib/load-admin-page-data";

export default async function AdminAccountsRoute() {
  const { admin, dashboard } = await loadAdminPageData();

  return (
    <AdminAccountsPage
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
    />
  );
}
