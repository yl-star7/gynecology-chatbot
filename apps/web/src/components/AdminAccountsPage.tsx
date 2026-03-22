"use client";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import AdminPageFrame from "./AdminPageFrame";
import { AdminAccountSection } from "./admin/AdminAccountSection";
import { useAdminAccountsState } from "./admin/useAdminAccountsState";

interface AdminAccountsPageProps {
  adminDisplayName: string;
  dashboard: AdminDashboardData;
}

export default function AdminAccountsPage({
  adminDisplayName,
  dashboard,
}: AdminAccountsPageProps) {
  const state = useAdminAccountsState(dashboard);

  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath="/admin/accounts"
      title="계정"
    >
      <AdminAccountSection
        managedUsers={state.managedUsers}
        recoveryActions={dashboard.recoveryActions}
        allowedPhoneNumbers={state.allowedPhoneNumbers}
        selectedUserId={state.selectedUserId}
        phoneNumber={state.phoneNumber}
        reason={state.reason}
        selectedAllowedPhoneId={state.selectedAllowedPhoneId}
        allowedPhoneNumber={state.allowedPhoneNumber}
        allowedDisplayName={state.allowedDisplayName}
        allowedNote={state.allowedNote}
        actionMessage={state.actionMessage}
        isSubmitting={state.isAccountSubmitting}
        onSelectUser={state.syncSelectedUser}
        onPhoneNumberChange={state.setPhoneNumber}
        onReasonChange={state.setReason}
        onSelectAllowedPhone={state.syncSelectedAllowedPhone}
        onAllowedPhoneNumberChange={state.setAllowedPhoneNumber}
        onAllowedDisplayNameChange={state.setAllowedDisplayName}
        onAllowedNoteChange={state.setAllowedNote}
        onUpdatePhoneNumber={state.handleUpdatePhoneNumber}
        onResetSession={state.handleResetSession}
        onCreateAllowedPhoneNumber={state.handleCreateAllowedPhoneNumber}
        onUpdateAllowedPhoneNumber={state.handleUpdateAllowedPhoneNumber}
        onDeleteAllowedPhoneNumber={state.handleDeleteAllowedPhoneNumber}
      />
    </AdminPageFrame>
  );
}
