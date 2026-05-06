"use client";

import type { ReactNode } from "react";

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
    | "/admin/content/policies"
    | "/admin/assets/weeks"
    | "/admin/engine/copy"
    | "/admin/engine/workflows";
  title: string;
  view: "documents" | "static" | "weeks" | "policies";
  topSlot?: ReactNode;
  policiesInitialView?: "list" | "editor";
}

export default function AdminContentPage({
  adminDisplayName,
  dashboard,
  currentPath,
  title,
  view,
  topSlot,
  policiesInitialView = "list",
}: AdminContentPageProps) {
  const state = useAdminContentState(dashboard, view);

  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath={currentPath}
      title={title}
    >
      {topSlot}
      <AdminContentSection
        homeCopyItems={state.homeCopyItems}
        selectedHomeCopyItemId={state.selectedHomeCopyItemId}
        knowledgeItems={state.knowledgeItems}
        selectedKnowledgeItemId={state.selectedKnowledgeItemId}
        homeCopySlot={state.homeCopySlot}
        homeCopyVariant={state.homeCopyVariant}
        homeCopyTitle={state.homeCopyTitle}
        homeCopyBody={state.homeCopyBody}
        homeCopyStatus={state.homeCopyStatus}
        homeCopyDisplayOrder={state.homeCopyDisplayOrder}
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
        isHomeCopySaving={state.isHomeCopySaving}
        isKnowledgeSaving={state.isKnowledgeSaving}
        isWorkflowSaving={state.isWorkflowSaving}
        isWorkflowRunning={state.isWorkflowRunning}
        isWorkflowDeleting={state.isWorkflowDeleting}
        isWeekSaving={state.isWeekSaving}
        onSelectHomeCopyItem={state.syncSelectedHomeCopyItem}
        onHomeCopySlotChange={state.setHomeCopySlot}
        onHomeCopyVariantChange={state.setHomeCopyVariant}
        onHomeCopyTitleChange={state.setHomeCopyTitle}
        onHomeCopyBodyChange={state.setHomeCopyBody}
        onHomeCopyStatusChange={state.setHomeCopyStatus}
        onHomeCopyDisplayOrderChange={state.setHomeCopyDisplayOrder}
        onCreateHomeCopyItem={state.handleCreateHomeCopyItem}
        onUpdateHomeCopyItem={state.handleUpdateHomeCopyItem}
        onDeleteHomeCopyItem={state.handleDeleteHomeCopyItem}
        onResetHomeCopyItem={state.resetHomeCopyItemForm}
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
        onToggleRagFile={state.handleToggleRagFile}
        onSelectWorkflowRule={state.syncSelectedWorkflowRule}
        onWorkflowNameChange={state.setWorkflowName}
        onWorkflowTriggerChange={state.setWorkflowTrigger}
        onWorkflowRetrievalScopeChange={state.setWorkflowRetrievalScope}
        onWorkflowModelNameChange={state.setWorkflowModelName}
        onWorkflowStatusChange={state.setWorkflowStatus}
        onSaveWorkflowRule={state.handleSaveWorkflowRule}
        onRunWorkflowRule={state.handleRunWorkflowRule}
        onDeleteWorkflowRule={state.handleDeleteWorkflowRule}
        onSelectWeek={state.handleSelectWeek}
        onWeekFieldChange={state.handleWeekFieldChange}
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
        policiesInitialView={policiesInitialView}
      />
    </AdminPageFrame>
  );
}
