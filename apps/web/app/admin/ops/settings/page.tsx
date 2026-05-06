import { requireAdminSession } from "@/lib/admin/auth";

import AdminPageFrame from "@/components/AdminPageFrame";
import { AdminOperationsPanel } from "@/components/admin/AdminOperationsPanel";

export const dynamic = "force-dynamic";

export default async function AdminOpsSettingsRoute() {
  const admin = await requireAdminSession();

  return (
    <AdminPageFrame
      adminDisplayName={admin.displayName}
      currentPath="/admin/ops/settings"
      title="운영 설정"
    >
      <AdminOperationsPanel />
    </AdminPageFrame>
  );
}
