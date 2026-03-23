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
      currentPath="/admin/operations"
      title="운영 상태"
    >
      <AdminOperationsPanel />
    </AdminPageFrame>
  );
}
