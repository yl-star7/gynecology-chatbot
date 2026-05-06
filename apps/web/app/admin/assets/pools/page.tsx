import AdminPoolsPage from "@/components/AdminPoolsPage";

import { requireAdminSession } from "@/lib/admin/auth";

export default async function AdminAssetsPoolsRoute() {
  const admin = await requireAdminSession();

  return <AdminPoolsPage adminDisplayName={admin.displayName} />;
}
