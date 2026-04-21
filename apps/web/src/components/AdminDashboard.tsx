"use client";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import { AdminAccountSection } from "./admin/AdminAccountSection";
import { AdminConsoleShell } from "./admin/AdminConsoleShell";
import { AdminContentSection } from "./admin/AdminContentSection";
import { AdminMetricsBar } from "./admin/AdminMetricsBar";
import { AdminMonitoringSection } from "./admin/AdminMonitoringSection";
import { AdminOperationsPanel } from "./admin/AdminOperationsPanel";
import { useAdminDashboardState } from "./admin/useAdminDashboardState";

interface AdminDashboardProps {
  dashboard: AdminDashboardData;
  adminDisplayName: string;
}

export default function AdminDashboard({
  dashboard,
  adminDisplayName,
}: AdminDashboardProps) {
  const state = useAdminDashboardState(dashboard) as ReturnType<
    typeof useAdminDashboardState
  > & {
    handlePauseUser: () => Promise<void>;
    handleResumeUser: () => Promise<void>;
  };

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <AdminConsoleShell
      adminDisplayName={adminDisplayName}
      currentPath="/admin/operations"
      title="운영 상태"
      onLogout={handleLogout}
    >
      <AdminMetricsBar metrics={dashboard.metrics} />
      <section id="operations">
        <AdminOperationsPanel />
      </section>
      <section id="accounts">
        <AdminAccountSection
          managedUsers={state.managedUsers}
          allowedPhoneNumbers={state.allowedPhoneNumbers}
          userSearchQuery=""
          selectedUserId={state.selectedUserId}
          phoneNumber={state.phoneNumber}
          reason={state.reason}
          selectedAllowedPhoneId={state.selectedAllowedPhoneId}
          allowedPhoneNumber={state.allowedPhoneNumber}
          allowedDisplayName={state.allowedDisplayName}
          allowedNote={state.allowedNote}
          actionMessage={state.actionMessage}
          isSubmitting={state.isAccountSubmitting}
          onUserSearchQueryChange={() => {}}
          onSelectUser={state.syncSelectedUser}
          onPhoneNumberChange={state.setPhoneNumber}
          onReasonChange={state.setReason}
          onSelectAllowedPhone={state.syncSelectedAllowedPhone}
          onAllowedPhoneNumberChange={state.setAllowedPhoneNumber}
          onAllowedDisplayNameChange={state.setAllowedDisplayName}
          onAllowedNoteChange={state.setAllowedNote}
          onUpdatePhoneNumber={state.handleUpdatePhoneNumber}
          onResetSession={state.handleResetSession}
          onPauseUser={state.handlePauseUser}
          onResumeUser={state.handleResumeUser}
          onCreateAllowedPhoneNumber={state.handleCreateAllowedPhoneNumber}
          onUpdateAllowedPhoneNumber={state.handleUpdateAllowedPhoneNumber}
          onDeleteAllowedPhoneNumber={state.handleDeleteAllowedPhoneNumber}
        />
      </section>
      <section id="content">
        <AdminContentSection
          homeCopyItems={[]}
          selectedHomeCopyItemId=""
          knowledgeItems={state.knowledgeItems}
          selectedKnowledgeItemId={state.selectedKnowledgeItemId}
          homeCopySlot="hero_bubble"
          homeCopyVariant=""
          homeCopyTitle=""
          homeCopyBody=""
          homeCopyStatus="published"
          homeCopyDisplayOrder=""
          knowledgeSlug={state.knowledgeSlug}
          knowledgeSection={state.knowledgeSection}
          knowledgeTitle={state.knowledgeTitle}
          knowledgeBody={state.knowledgeBody}
          knowledgeImageUrl={state.knowledgeImageUrl}
          knowledgeStatus={state.knowledgeStatus}
          selectedRagDocumentId={state.selectedRagDocumentId}
          ragDocuments={state.ragDocuments}
          ragFiles={[]}
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
          uploadingCoverField={null}
          uploadingMediaIndex={null}
          isRagSubmitting={state.isRagSubmitting}
          isFileUploading={false}
          isHomeCopySaving={false}
          isKnowledgeSaving={state.isKnowledgeSaving}
          isWorkflowSaving={state.isWorkflowSaving}
          isWorkflowBootstrapping={state.isWorkflowSaving}
          isWorkflowRunning={false}
          isWorkflowDeleting={false}
          isWeekSaving={state.isWeekSaving}
          onSelectHomeCopyItem={() => {}}
          onHomeCopySlotChange={() => {}}
          onHomeCopyVariantChange={() => {}}
          onHomeCopyTitleChange={() => {}}
          onHomeCopyBodyChange={() => {}}
          onHomeCopyStatusChange={() => {}}
          onHomeCopyDisplayOrderChange={() => {}}
          onCreateHomeCopyItem={async () => {}}
          onUpdateHomeCopyItem={async () => {}}
          onDeleteHomeCopyItem={async () => {}}
          onResetHomeCopyItem={() => {}}
          onSelectKnowledgeItem={state.syncSelectedKnowledgeItem}
          onKnowledgeSlugChange={state.setKnowledgeSlug}
          onKnowledgeSectionChange={state.setKnowledgeSection}
          onKnowledgeTitleChange={state.setKnowledgeTitle}
          onKnowledgeBodyChange={state.setKnowledgeBody}
          onKnowledgeImageUrlChange={state.setKnowledgeImageUrl}
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
          onUploadRagFile={async () => {}}
          onDeleteRagFile={async () => {}}
          onToggleRagFile={async () => {}}
          onSelectWorkflowRule={state.syncSelectedWorkflowRule}
          onWorkflowNameChange={state.setWorkflowName}
          onWorkflowTriggerChange={state.setWorkflowTrigger}
          onWorkflowRetrievalScopeChange={state.setWorkflowRetrievalScope}
          onWorkflowModelNameChange={state.setWorkflowModelName}
          onWorkflowStatusChange={state.setWorkflowStatus}
          onSaveWorkflowRule={state.handleSaveWorkflowRule}
          onBootstrapWorkflowRule={async () => {}}
          onRunWorkflowRule={async () => {}}
          onDeleteWorkflowRule={async () => {}}
          onSelectWeek={state.handleSelectWeek}
          onWeekFieldChange={state.handleWeekFieldChange}
          onWeekStatusChange={state.handleWeekStatusChange}
          onUploadWeekCoverImage={async () => {}}
          onWeekDayChange={state.handleWeekDayChange}
          onWeekSectionChange={state.handleWeekSectionChange}
          onWeekAssetChange={state.handleWeekAssetChange}
          onWeekMediaChange={state.handleWeekMediaChange}
          onUploadWeekMedia={async () => {}}
          onAddWeekDay={state.handleAddWeekDay}
          onAddWeekSection={state.handleAddWeekSection}
          onAddWeekAsset={state.handleAddWeekAsset}
          onAddWeekMedia={state.handleAddWeekMedia}
          onMoveWeekDay={state.handleMoveWeekDay}
          onMoveWeekSection={state.handleMoveWeekSection}
          onMoveWeekAsset={state.handleMoveWeekAsset}
          onMoveWeekMedia={state.handleMoveWeekMedia}
          onRemoveWeekDay={state.handleRemoveWeekDay}
          onRemoveWeekSection={state.handleRemoveWeekSection}
          onRemoveWeekAsset={state.handleRemoveWeekAsset}
          onRemoveWeekMedia={state.handleRemoveWeekMedia}
          onSaveWeek={state.handleSaveWeek}
          onPublishWeek={state.handlePublishWeek}
        />
      </section>
      <section id="monitoring">
        <AdminMonitoringSection
          userActions={dashboard.userActions}
          historyUsers={dashboard.historyUsers}
          focusedHistoryUser={state.focusedHistoryUser}
          focusedUserActions={state.focusedUserActions}
          searchQuery=""
          selectedActionType="all"
          actionPage={1}
          userPage={1}
          onSearchQueryChange={() => {}}
          onSelectedActionTypeChange={() => {}}
          onActionPageChange={() => {}}
          onUserPageChange={() => {}}
          onFocusUser={state.setFocusedUserId}
        />
      </section>
    </AdminConsoleShell>
  );
}
