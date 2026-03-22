"use client";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import AdminPageFrame from "./AdminPageFrame";
import { AdminOperationsPanel } from "./admin/AdminOperationsPanel";

interface AdminOperationsPageProps {
  adminDisplayName: string;
  dashboard: AdminDashboardData;
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
