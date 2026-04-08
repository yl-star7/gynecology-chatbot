"use client";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import AdminPageFrame from "./AdminPageFrame";
import { AdminContentSection } from "./admin/AdminContentSection";
import { useAdminContentState } from "./admin/useAdminContentState";

interface AdminContentPageProps {
  adminDisplayName: string;
  dashboard: AdminDashboardData;
  currentPath:
    | "/admin/content/documents"
    | "/admin/content/static"
    | "/admin/content/weeks"
    | "/admin/content/policies";
  title: string;
  view: "documents" | "static" | "weeks" | "policies";
}

export default function AdminContentPage({
  adminDisplayName,
  dashboard,
  currentPath,
  title,
  view,
}: AdminContentPageProps) {
  const state = useAdminContentState(dashboard, view);

  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath={currentPath}
      title={title}
    >
      <AdminContentSection
        knowledgeItems={state.knowledgeItems}
        selectedKnowledgeItemId={state.selectedKnowledgeItemId}
        knowledgeSlug={state.knowledgeSlug}
        knowledgeSection={state.knowledgeSection}
        knowledgeTitle={state.knowledgeTitle}
        knowledgeBody={state.knowledgeBody}
        knowledgeImageUrl={state.knowledgeImageUrl}
        knowledgeStatus={state.knowledgeStatus}
        selectedRagDocumentId={state.selectedRagDocumentId}
        ragDocuments={state.ragDocuments}
        ragFiles={state.ragFiles}
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
        uploadingCoverField={state.uploadingCoverField}
        isRagSubmitting={state.isRagSubmitting}
        isFileUploading={state.isFileUploading}
        isKnowledgeSaving={state.isKnowledgeSaving}
        isWorkflowSaving={state.isWorkflowSaving}
        isWorkflowBootstrapping={state.isWorkflowBootstrapping}
        isWorkflowRunning={state.isWorkflowRunning}
        isWorkflowDeleting={state.isWorkflowDeleting}
        isWeekSaving={state.isWeekSaving}
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
        onResetKnowledgeItem={state.resetKnowledgeItemForm}
        onSelectRagDocument={state.syncSelectedRagDocument}
        onResetRagDocument={state.resetRagDocumentForm}
        onRagTitleChange={state.setRagTitle}
        onRagCategoryChange={state.setRagCategory}
        onRagWeekChange={state.setRagWeek}
        onRagContentChange={state.setRagContent}
        onUploadRagDocument={state.handleUploadRagDocument}
        onDeleteRagDocument={state.handleDeleteRagDocument}
        onUploadRagFile={state.handleUploadRagFile}
        onDeleteRagFile={state.handleDeleteRagFile}
        onSelectWorkflowRule={state.syncSelectedWorkflowRule}
        onWorkflowNameChange={state.setWorkflowName}
        onWorkflowTriggerChange={state.setWorkflowTrigger}
        onWorkflowRetrievalScopeChange={state.setWorkflowRetrievalScope}
        onWorkflowModelNameChange={state.setWorkflowModelName}
        onWorkflowStatusChange={state.setWorkflowStatus}
        onSaveWorkflowRule={state.handleSaveWorkflowRule}
        onBootstrapWorkflowRule={state.handleBootstrapWorkflowRule}
        onRunWorkflowRule={state.handleRunWorkflowRule}
        onDeleteWorkflowRule={state.handleDeleteWorkflowRule}
        onSelectWeek={state.handleSelectWeek}
        onWeekFieldChange={state.handleWeekFieldChange}
        onWeekStatusChange={state.handleWeekStatusChange}
        onUploadWeekCoverImage={state.handleUploadWeekCoverImage}
        onWeekDayChange={state.handleWeekDayChange}
        onWeekSectionChange={state.handleWeekSectionChange}
        onWeekAssetChange={state.handleWeekAssetChange}
        onWeekMediaChange={state.handleWeekMediaChange}
        uploadingMediaIndex={state.uploadingMediaIndex}
        onUploadWeekMedia={state.handleUploadWeekMedia}
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
        view={view}
      />
    </AdminPageFrame>
  );
}
