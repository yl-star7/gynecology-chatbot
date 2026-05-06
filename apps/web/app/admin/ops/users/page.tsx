import AdminAccountsPage from "@/components/AdminAccountsPage";

import { loadAdminPageData } from "../../_lib/load-admin-page-data";

export const dynamic = "force-dynamic";

export default async function AdminOpsUsersRoute() {
  const { admin, dashboard } = await loadAdminPageData();

  return (
    <AdminAccountsPage
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
      title="사용자 운영 액션"
      currentPath="/admin/ops/users"
    />
  );
}
