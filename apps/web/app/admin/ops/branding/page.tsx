import { requireAdminSession } from "@/lib/admin/auth";

import AdminPageFrame from "@/components/AdminPageFrame";
import { AdminOpsBrandingPanel } from "@/components/admin/AdminOpsBrandingPanel";

export const dynamic = "force-dynamic";

export default async function AdminOpsBrandingRoute() {
  const admin = await requireAdminSession();

  return (
    <AdminPageFrame
      adminDisplayName={admin.displayName}
      currentPath="/admin/ops/branding"
      title="브랜딩"
    >
      <AdminOpsBrandingPanel />
    </AdminPageFrame>
  );
}
