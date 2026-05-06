import AdminLexiconSection from "@/components/admin/AdminLexiconSection";

import { loadAdminPageData } from "../_lib/load-admin-page-data";

export default async function AdminLexiconRoute() {
  const { admin, dashboard } = await loadAdminPageData();

  return (
    <AdminLexiconSection
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
    />
  );
}
