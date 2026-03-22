"use client";

import { useMemo, useState } from "react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import AdminPageFrame from "./AdminPageFrame";
import { AdminMonitoringSection } from "./admin/AdminMonitoringSection";

interface AdminMonitoringPageProps {
  adminDisplayName: string;
  dashboard: AdminDashboardData;
}

export default function AdminMonitoringPage({
  adminDisplayName,
  dashboard,
}: AdminMonitoringPageProps) {
  const [focusedUserId, setFocusedUserId] = useState(
    dashboard.historyUsers[0]?.id ?? "",
  );

  const focusedHistoryUser = useMemo(
    () =>
      dashboard.historyUsers.find((user) => user.id === focusedUserId) ??
      dashboard.historyUsers[0],
    [dashboard.historyUsers, focusedUserId],
  );

  const focusedUserActions = useMemo(
    () =>
      dashboard.userActions
        .filter((action) => action.userId === focusedHistoryUser?.id)
        .slice(0, 8),
    [dashboard.userActions, focusedHistoryUser?.id],
  );

  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath="/admin/monitoring"
      title="모니터링"
    >
      <AdminMonitoringSection
        userActions={dashboard.userActions}
        historyUsers={dashboard.historyUsers}
        focusedHistoryUser={focusedHistoryUser}
        focusedUserActions={focusedUserActions}
        onFocusUser={setFocusedUserId}
      />
    </AdminPageFrame>
  );
}
