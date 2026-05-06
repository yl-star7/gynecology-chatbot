"use client";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import AdminPageFrame from "./AdminPageFrame";
import { AdminAccountSection } from "./admin/AdminAccountSection";
import { useAdminAccountsState } from "./admin/useAdminAccountsState";

interface AdminAccountsPageProps {
  adminDisplayName: string;
  dashboard: AdminDashboardData;
  title?: string;
  currentPath?: string;
}

export default function AdminAccountsPage({
  adminDisplayName,
  dashboard,
  title = "사용자 설정",
  currentPath = "/admin/accounts",
}: AdminAccountsPageProps) {
  const pathname = usePathname() ?? currentPath;
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedSearchParams = searchParams ?? new URLSearchParams();
  const selectedUserId = resolvedSearchParams.get("user") ?? undefined;
  const selectedAllowedPhoneId =
    resolvedSearchParams.get("allowed") ?? undefined;
  const userSearchQuery = resolvedSearchParams.get("query") ?? "";
  const state = useAdminAccountsState(
    dashboard,
    selectedUserId,
    selectedAllowedPhoneId,
  );

  const filteredUserIds = useMemo(() => {
    const query = userSearchQuery.trim().toLowerCase();
    return dashboard.managedUsers
      .filter((user) => {
        if (!query) {
          return true;
        }

        return (
          user.name.toLowerCase().includes(query) ||
          user.phoneNumber.toLowerCase().includes(query) ||
          user.latestIssue.toLowerCase().includes(query)
        );
      })
      .map((user) => user.id);
  }, [dashboard.managedUsers, userSearchQuery]);

  function replaceSearchParams(nextValues: Record<string, string | null>) {
    const nextSearchParams = new URLSearchParams(
      resolvedSearchParams.toString(),
    );
    for (const [key, value] of Object.entries(nextValues)) {
      if (!value) {
        nextSearchParams.delete(key);
      } else {
        nextSearchParams.set(key, value);
      }
    }

    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }

  function handleSelectUser(userId: string) {
    state.syncSelectedUser(userId);
    replaceSearchParams({ user: userId });
  }

  function handleSelectAllowedPhone(id: string) {
    state.syncSelectedAllowedPhone(id);
    replaceSearchParams({ allowed: id });
  }

  function handleUserSearchQueryChange(value: string) {
    const nextQuery = value.trim();
    const nextSelectedUser =
      nextQuery &&
      state.selectedUserId &&
      !filteredUserIds.includes(state.selectedUserId)
        ? (dashboard.managedUsers.find((user) => {
            return (
              user.name.toLowerCase().includes(nextQuery.toLowerCase()) ||
              user.phoneNumber
                .toLowerCase()
                .includes(nextQuery.toLowerCase()) ||
              user.latestIssue.toLowerCase().includes(nextQuery.toLowerCase())
            );
          })?.id ?? null)
        : state.selectedUserId;

    if (nextSelectedUser && nextSelectedUser !== state.selectedUserId) {
      state.syncSelectedUser(nextSelectedUser);
    }

    replaceSearchParams({
      query: nextQuery || null,
      user: nextSelectedUser ?? null,
    });
  }

  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath={currentPath}
      title={title}
    >
      <AdminAccountSection
        managedUsers={state.managedUsers}
        allowedPhoneNumbers={state.allowedPhoneNumbers}
        userSearchQuery={userSearchQuery}
        selectedUserId={state.selectedUserId}
        phoneNumber={state.phoneNumber}
        reason={state.reason}
        selectedAllowedPhoneId={state.selectedAllowedPhoneId}
        allowedPhoneNumber={state.allowedPhoneNumber}
        allowedDisplayName={state.allowedDisplayName}
        allowedNote={state.allowedNote}
        actionMessage={state.actionMessage}
        isSubmitting={state.isAccountSubmitting}
        onUserSearchQueryChange={handleUserSearchQueryChange}
        onSelectUser={handleSelectUser}
        onPhoneNumberChange={state.setPhoneNumber}
        onReasonChange={state.setReason}
        onSelectAllowedPhone={handleSelectAllowedPhone}
        onAllowedPhoneNumberChange={state.setAllowedPhoneNumber}
        onAllowedDisplayNameChange={state.setAllowedDisplayName}
        onAllowedNoteChange={state.setAllowedNote}
        onUpdatePhoneNumber={state.handleUpdatePhoneNumber}
        onResetSession={state.handleResetSession}
        onPauseUser={state.handlePauseUser}
        onResumeUser={state.handleResumeUser}
        onApproveUser={state.handleApproveUser}
        onRejectUser={state.handleRejectUser}
        onCreateAllowedPhoneNumber={state.handleCreateAllowedPhoneNumber}
        onUpdateAllowedPhoneNumber={state.handleUpdateAllowedPhoneNumber}
        onDeleteAllowedPhoneNumber={state.handleDeleteAllowedPhoneNumber}
      />
    </AdminPageFrame>
  );
}
