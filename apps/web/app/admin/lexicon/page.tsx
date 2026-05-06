import AdminLexiconSection from "@/components/admin/AdminLexiconSection";
import { loadSchiftDrift } from "@/lib/admin/lexicon-drift";

import { loadAdminPageData } from "../_lib/load-admin-page-data";

export default async function AdminLexiconRoute() {
  const { admin, dashboard } = await loadAdminPageData();
  const drift = await loadSchiftDrift();

  return (
    <AdminLexiconSection
      adminDisplayName={admin.displayName}
      dashboard={dashboard}
      initialDrift={drift}
    />
  );
}
