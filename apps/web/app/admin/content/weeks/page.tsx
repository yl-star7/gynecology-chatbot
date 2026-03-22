import AdminContentPage from "@/components/AdminContentPage";

import { loadAdminPageData } from "../../_lib/load-admin-page-data";

export default async function AdminContentWeeksRoute() {
  const { admin, dashboard } = await loadAdminPageData();

  return (
    <AdminContentPage
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
      currentPath="/admin/content/weeks"
      title="주차 데이터"
      view="weeks"
    />
  );
}
