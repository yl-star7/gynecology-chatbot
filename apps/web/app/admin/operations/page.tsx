import AdminOperationsPage from "@/components/AdminOperationsPage";

import { requireAdminSession } from "@/lib/admin/auth";

export default async function AdminOperationsRoute() {
  const admin = await requireAdminSession();

  return <AdminOperationsPage adminDisplayName={admin.displayName} />;
}
