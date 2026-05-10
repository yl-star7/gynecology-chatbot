"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const pathname = usePathname() ?? "/admin/ops/monitoring";
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedSearchParams = searchParams ?? new URLSearchParams();
  const focusedUserId =
    resolvedSearchParams.get("user") ?? dashboard.historyUsers[0]?.id ?? "";
  const searchQuery = resolvedSearchParams.get("query") ?? "";
  const selectedActionType = resolvedSearchParams.get("actionType") ?? "all";
  const actionPage = Math.max(
    1,
    Number(resolvedSearchParams.get("actionPage") ?? "1") || 1,
  );
  const userPage = Math.max(
    1,
    Number(resolvedSearchParams.get("userPage") ?? "1") || 1,
  );

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

  const focusedHistoryUser = useMemo(
    () =>
      dashboard.historyUsers.find((user) => user.id === focusedUserId) ??
      dashboard.historyUsers[0],
    [dashboard.historyUsers, focusedUserId],
  );

  const filteredFocusedUserActions = useMemo(
    () =>
      dashboard.userActions
        .filter((action) => action.userId === focusedHistoryUser?.id)
        .slice(0, 8),
    [dashboard.userActions, focusedHistoryUser?.id],
  );

  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath="/admin/ops/monitoring"
      title="모니터링"
    >
      <AdminMonitoringSection
        userActions={dashboard.userActions}
        historyUsers={dashboard.historyUsers}
        focusedHistoryUser={focusedHistoryUser}
        focusedUserActions={filteredFocusedUserActions}
        searchQuery={searchQuery}
        selectedActionType={selectedActionType}
        actionPage={actionPage}
        userPage={userPage}
        onSearchQueryChange={(value) =>
          replaceSearchParams({
            query: value.trim() || null,
            actionPage: "1",
            userPage: "1",
          })
        }
        onSelectedActionTypeChange={(value) =>
          replaceSearchParams({
            actionType: value === "all" ? null : value,
            actionPage: "1",
          })
        }
        onActionPageChange={(value) =>
          replaceSearchParams({ actionPage: value <= 1 ? null : String(value) })
        }
        onUserPageChange={(value) =>
          replaceSearchParams({ userPage: value <= 1 ? null : String(value) })
        }
        onFocusUser={(userId) => replaceSearchParams({ user: userId || null })}
      />
    </AdminPageFrame>
  );
}
