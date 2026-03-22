import AdminContentPage from "@/components/AdminContentPage";

import { loadAdminPageData } from "../../_lib/load-admin-page-data";

export default async function AdminContentPoliciesRoute() {
  const { admin, dashboard } = await loadAdminPageData();

  return (
    <AdminContentPage
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
      currentPath="/admin/content/policies"
      title="응답 정책"
      view="policies"
    />
  );
}
