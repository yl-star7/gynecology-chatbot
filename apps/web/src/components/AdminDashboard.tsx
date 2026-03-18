"use client";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import { AdminAccountSection } from "./admin/AdminAccountSection";
import { AdminConsoleShell } from "./admin/AdminConsoleShell";
import { AdminContentSection } from "./admin/AdminContentSection";
import { AdminMetricsBar } from "./admin/AdminMetricsBar";
import { AdminMonitoringSection } from "./admin/AdminMonitoringSection";
import { useAdminDashboardState } from "./admin/useAdminDashboardState";

interface AdminDashboardProps {
  dashboard: AdminDashboardData;
  adminDisplayName: string;
}

export default function AdminDashboard({
  dashboard,
  adminDisplayName,
}: AdminDashboardProps) {
  const state = useAdminDashboardState(dashboard);

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <AdminConsoleShell
      adminDisplayName={adminDisplayName}
      attentionUserCount={state.attentionUserCount}
      readyDocumentCount={state.readyDocumentCount}
      onLogout={handleLogout}
    >
      <AdminMetricsBar metrics={dashboard.metrics} />
      <AdminAccountSection
        managedUsers={state.managedUsers}
        recoveryActions={dashboard.recoveryActions}
        selectedUserId={state.selectedUserId}
        phoneNumber={state.phoneNumber}
        reason={state.reason}
        actionMessage={state.actionMessage}
        isSubmitting={state.isAccountSubmitting}
        onSelectUser={state.syncSelectedUser}
        onPhoneNumberChange={state.setPhoneNumber}
        onReasonChange={state.setReason}
        onUpdatePhoneNumber={state.handleUpdatePhoneNumber}
        onResetPassword={state.handleResetPassword}
      />
      <AdminContentSection
        ragDocuments={state.ragDocuments}
        workflowRules={dashboard.workflowRules}
        contentMessage={state.contentMessage}
        ragTitle={state.ragTitle}
        ragCategory={state.ragCategory}
        ragWeek={state.ragWeek}
        ragContent={state.ragContent}
        weekSummaries={state.weekSummaries}
        selectedWeekNumber={state.selectedWeekNumber}
        selectedWeekDetail={state.selectedWeekDetail}
        isLoadingWeeks={state.isLoadingWeeks}
        isRagSubmitting={state.isRagSubmitting}
        isWeekSaving={state.isWeekSaving}
        onRagTitleChange={state.setRagTitle}
        onRagCategoryChange={state.setRagCategory}
        onRagWeekChange={state.setRagWeek}
        onRagContentChange={state.setRagContent}
        onUploadRagDocument={state.handleUploadRagDocument}
        onSelectWeek={state.handleSelectWeek}
        onWeekFieldChange={state.handleWeekFieldChange}
        onWeekStatusChange={state.handleWeekStatusChange}
        onWeekSectionChange={state.handleWeekSectionChange}
        onWeekAssetChange={state.handleWeekAssetChange}
        onAddWeekSection={state.handleAddWeekSection}
        onAddWeekAsset={state.handleAddWeekAsset}
        onMoveWeekSection={state.handleMoveWeekSection}
        onMoveWeekAsset={state.handleMoveWeekAsset}
        onRemoveWeekSection={state.handleRemoveWeekSection}
        onRemoveWeekAsset={state.handleRemoveWeekAsset}
        onSaveWeek={state.handleSaveWeek}
      />
      <AdminMonitoringSection
        userActions={dashboard.userActions}
        historyUsers={dashboard.historyUsers}
        focusedHistoryUser={state.focusedHistoryUser}
        focusedUserActions={state.focusedUserActions}
        onFocusUser={state.setFocusedUserId}
      />
    </AdminConsoleShell>
  );
}
