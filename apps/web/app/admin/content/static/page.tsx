import AdminContentPage from "@/components/AdminContentPage";

import { loadAdminPageData } from "../../_lib/load-admin-page-data";

export default async function AdminContentStaticRoute() {
  const { admin, dashboard } = await loadAdminPageData();

  return (
    <AdminContentPage
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
      currentPath="/admin/content/static"
      title="지식 콘텐츠"
      view="static"
    />
  );
}
