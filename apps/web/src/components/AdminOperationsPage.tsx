"use client";

import AdminPageFrame from "./AdminPageFrame";
import { AdminOperationsPanel } from "./admin/AdminOperationsPanel";

interface AdminOperationsPageProps {
  adminDisplayName: string;
}

export default function AdminOperationsPage({
  adminDisplayName,
}: AdminOperationsPageProps) {
  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath="/admin/ops/settings"
      title="운영 설정"
    >
      <AdminOperationsPanel />
    </AdminPageFrame>
  );
}
