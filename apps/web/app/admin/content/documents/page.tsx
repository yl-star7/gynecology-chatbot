import AdminContentPage from "@/components/AdminContentPage";

import { loadAdminPageData } from "../../_lib/load-admin-page-data";

export default async function AdminContentDocumentsRoute() {
  const { admin, dashboard } = await loadAdminPageData();

  return (
    <AdminContentPage
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
      currentPath="/admin/content/documents"
      title="참조 파일"
      view="documents"
    />
  );
}
