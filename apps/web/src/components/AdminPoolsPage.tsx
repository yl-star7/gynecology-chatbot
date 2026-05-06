"use client";

import AdminPageFrame from "./AdminPageFrame";
import { AdminPoolsSection } from "./admin/AdminPoolsSection";

interface AdminPoolsPageProps {
  adminDisplayName: string;
}

export default function AdminPoolsPage({
  adminDisplayName,
}: AdminPoolsPageProps) {
  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath="/admin/assets/pools"
      title="공통 풀"
    >
      <AdminPoolsSection />
    </AdminPageFrame>
  );
}
