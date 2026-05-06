import { requireAdminSession } from "@/lib/admin/auth";

import AdminPageFrame from "@/components/AdminPageFrame";
import { AdminOpsAuditSection } from "@/components/admin/AdminOpsAuditSection";

import { loadAdminOpsAuditLogs } from "./_lib/load-audit-logs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminOpsAuditRoute() {
  const admin = await requireAdminSession();
  const logs = await loadAdminOpsAuditLogs();

  return (
    <AdminPageFrame
      adminDisplayName={admin.displayName}
      currentPath="/admin/ops/audit"
      title="감사 로그"
    >
      <AdminOpsAuditSection logs={logs} />
    </AdminPageFrame>
  );
}
