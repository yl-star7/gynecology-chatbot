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
      <section id="operations">
        <AdminMetricsBar metrics={dashboard.metrics} />
      </section>
      <section id="accounts">
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
      </section>
      <section id="content">
        <AdminContentSection
          knowledgeItems={state.knowledgeItems}
          selectedKnowledgeItemId={state.selectedKnowledgeItemId}
          knowledgeSlug={state.knowledgeSlug}
          knowledgeSection={state.knowledgeSection}
          knowledgeTitle={state.knowledgeTitle}
          knowledgeBody={state.knowledgeBody}
          knowledgeStatus={state.knowledgeStatus}
          selectedRagDocumentId={state.selectedRagDocumentId}
          ragDocuments={state.ragDocuments}
          workflowRules={state.workflowRules}
          contentMessage={state.contentMessage}
          ragTitle={state.ragTitle}
          ragCategory={state.ragCategory}
          ragWeek={state.ragWeek}
          ragContent={state.ragContent}
          selectedWorkflowRuleId={state.selectedWorkflowRuleId}
          workflowName={state.workflowName}
          workflowTrigger={state.workflowTrigger}
          workflowRetrievalScope={state.workflowRetrievalScope}
          workflowModelName={state.workflowModelName}
          workflowStatus={state.workflowStatus}
          weekSummaries={state.weekSummaries}
          selectedWeekNumber={state.selectedWeekNumber}
          selectedWeekDetail={state.selectedWeekDetail}
          isLoadingWeeks={state.isLoadingWeeks}
          isRagSubmitting={state.isRagSubmitting}
          isKnowledgeSaving={state.isKnowledgeSaving}
          isWorkflowSaving={state.isWorkflowSaving}
          isWeekSaving={state.isWeekSaving}
          onSelectKnowledgeItem={state.syncSelectedKnowledgeItem}
          onKnowledgeSlugChange={state.setKnowledgeSlug}
          onKnowledgeSectionChange={state.setKnowledgeSection}
          onKnowledgeTitleChange={state.setKnowledgeTitle}
          onKnowledgeBodyChange={state.setKnowledgeBody}
          onKnowledgeStatusChange={state.setKnowledgeStatus}
          onCreateKnowledgeItem={state.handleCreateKnowledgeItem}
          onUpdateKnowledgeItem={state.handleUpdateKnowledgeItem}
          onDeleteKnowledgeItem={state.handleDeleteKnowledgeItem}
          onSelectRagDocument={state.syncSelectedRagDocument}
          onResetRagDocument={state.resetRagDocumentForm}
          onRagTitleChange={state.setRagTitle}
          onRagCategoryChange={state.setRagCategory}
          onRagWeekChange={state.setRagWeek}
          onRagContentChange={state.setRagContent}
          onUploadRagDocument={state.handleUploadRagDocument}
          onDeleteRagDocument={state.handleDeleteRagDocument}
          onSelectWorkflowRule={state.syncSelectedWorkflowRule}
          onWorkflowNameChange={state.setWorkflowName}
          onWorkflowTriggerChange={state.setWorkflowTrigger}
          onWorkflowRetrievalScopeChange={state.setWorkflowRetrievalScope}
          onWorkflowModelNameChange={state.setWorkflowModelName}
          onWorkflowStatusChange={state.setWorkflowStatus}
          onSaveWorkflowRule={state.handleSaveWorkflowRule}
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
      </section>
      <section id="monitoring">
        <AdminMonitoringSection
          userActions={dashboard.userActions}
          historyUsers={dashboard.historyUsers}
          focusedHistoryUser={state.focusedHistoryUser}
          focusedUserActions={state.focusedUserActions}
          onFocusUser={state.setFocusedUserId}
        />
      </section>
    </AdminConsoleShell>
  );
}
