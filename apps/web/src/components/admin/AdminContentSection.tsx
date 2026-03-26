"use client";

import type {
  AdminDashboardData,
  AdminKnowledgeItem,
  AdminWeekAsset,
  AdminWeekDay,
  AdminWeekDetail,
  AdminWeekMedia,
  AdminWeekSection,
  AdminWeekSummary,
} from "@gynecology-chatbot/app-core";

import { AdminDocumentsSection } from "./content/AdminDocumentsSection";
import { AdminPoliciesSection } from "./content/AdminPoliciesSection";
import { AdminStaticSection } from "./content/AdminStaticSection";
import { AdminWeeksSection } from "./content/AdminWeeksSection";

export interface AdminContentSectionProps {
  knowledgeItems: AdminKnowledgeItem[];
  selectedKnowledgeItemId: string;
  knowledgeSlug: string;
  knowledgeSection: AdminKnowledgeItem["section"];
  knowledgeTitle: string;
  knowledgeBody: string;
  knowledgeStatus: AdminKnowledgeItem["status"];
  selectedRagDocumentId: string;
  ragDocuments: AdminDashboardData["ragDocuments"];
  workflowRules: AdminDashboardData["workflowRules"];
  contentMessage: string | null;
  ragTitle: string;
  ragCategory: string;
  ragWeek: string;
  ragContent: string;
  selectedWorkflowRuleId: string;
  workflowName: string;
  workflowTrigger: string;
  workflowRetrievalScope: string;
  workflowModelName: string;
  workflowStatus: AdminDashboardData["workflowRules"][number]["status"];
  weekSummaries: AdminWeekSummary[];
  selectedWeekNumber: number | null;
  selectedWeekDetail: AdminWeekDetail | null;
  isLoadingWeeks: boolean;
  uploadingCoverField: "heroImagePath" | "compareImagePath" | null;
  uploadingMediaIndex: number | null;
  isRagSubmitting: boolean;
  isKnowledgeSaving: boolean;
  isWorkflowSaving: boolean;
  isWorkflowBootstrapping?: boolean;
  isWeekSaving: boolean;
  onSelectKnowledgeItem: (id: string) => void;
  onKnowledgeSlugChange: (value: string) => void;
  onKnowledgeSectionChange: (value: AdminKnowledgeItem["section"]) => void;
  onKnowledgeTitleChange: (value: string) => void;
  onKnowledgeBodyChange: (value: string) => void;
  onKnowledgeStatusChange: (value: AdminKnowledgeItem["status"]) => void;
  onCreateKnowledgeItem: () => Promise<void>;
  onUpdateKnowledgeItem: () => Promise<void>;
  onDeleteKnowledgeItem: () => Promise<void>;
  onResetKnowledgeItem?: () => void;
  onSelectRagDocument: (id: string) => Promise<void>;
  onResetRagDocument: () => void;
  onRagTitleChange: (value: string) => void;
  onRagCategoryChange: (value: string) => void;
  onRagWeekChange: (value: string) => void;
  onRagContentChange: (value: string) => void;
  onUploadRagDocument: () => Promise<void>;
  onDeleteRagDocument: () => Promise<void>;
  onSelectWorkflowRule: (id: string) => void;
  onWorkflowNameChange: (value: string) => void;
  onWorkflowTriggerChange: (value: string) => void;
  onWorkflowRetrievalScopeChange: (value: string) => void;
  onWorkflowModelNameChange: (value: string) => void;
  onWorkflowStatusChange: (
    value: AdminDashboardData["workflowRules"][number]["status"],
  ) => void;
  onSaveWorkflowRule: () => Promise<void>;
  onBootstrapWorkflowRule?: () => Promise<void>;
  onSelectWeek: (weekNumber: number) => void;
  onWeekFieldChange: (
    field:
      | "title"
      | "babySizeLabel"
      | "babySizeCompareObject"
      | "babySummary"
      | "motherSummary"
      | "heroImagePath"
      | "compareImagePath",
    value: string,
  ) => void;
  onWeekStatusChange: (value: AdminWeekDetail["status"]) => void;
  onUploadWeekCoverImage: (
    field: "heroImagePath" | "compareImagePath",
    file: File,
  ) => Promise<void>;
  onWeekDayChange: (
    index: number,
    field: keyof AdminWeekDay,
    value: string | number | string[] | null,
  ) => void;
  onWeekSectionChange: (
    index: number,
    field: keyof AdminWeekSection,
    value: string | number | boolean | null,
  ) => void;
  onWeekAssetChange: (
    index: number,
    field: keyof AdminWeekAsset,
    value: string | number | boolean | null,
  ) => void;
  onWeekMediaChange: (
    index: number,
    field: keyof AdminWeekMedia,
    value: string | number | null,
  ) => void;
  onUploadWeekMedia: (index: number, file: File) => Promise<void>;
  onAddWeekDay: () => void;
  onAddWeekSection: () => void;
  onAddWeekAsset: () => void;
  onAddWeekMedia: () => void;
  onMoveWeekDay: (index: number, direction: -1 | 1) => void;
  onMoveWeekSection: (index: number, direction: -1 | 1) => void;
  onMoveWeekAsset: (index: number, direction: -1 | 1) => void;
  onMoveWeekMedia: (index: number, direction: -1 | 1) => void;
  onRemoveWeekDay: (index: number) => void;
  onRemoveWeekSection: (index: number) => void;
  onRemoveWeekAsset: (index: number) => void;
  onRemoveWeekMedia: (index: number) => void;
  onSaveWeek: () => Promise<void>;
  view?: "all" | "documents" | "static" | "weeks" | "policies";
}

export function AdminContentSection({
  knowledgeItems,
  selectedKnowledgeItemId,
  knowledgeSlug,
  knowledgeSection,
  knowledgeTitle,
  knowledgeBody,
  knowledgeStatus,
  selectedRagDocumentId,
  ragDocuments,
  workflowRules,
  contentMessage,
  ragTitle,
  ragCategory,
  ragWeek,
  ragContent,
  selectedWorkflowRuleId,
  workflowName,
  workflowTrigger,
  workflowRetrievalScope,
  workflowModelName,
  workflowStatus,
  weekSummaries,
  selectedWeekNumber,
  selectedWeekDetail,
  isLoadingWeeks,
  uploadingCoverField,
  uploadingMediaIndex,
  isRagSubmitting,
  isKnowledgeSaving,
  isWorkflowSaving,
  isWorkflowBootstrapping = false,
  isWeekSaving,
  onSelectKnowledgeItem,
  onKnowledgeSlugChange,
  onKnowledgeSectionChange,
  onKnowledgeTitleChange,
  onKnowledgeBodyChange,
  onKnowledgeStatusChange,
  onCreateKnowledgeItem,
  onUpdateKnowledgeItem,
  onDeleteKnowledgeItem,
  onResetKnowledgeItem = () => {},
  onSelectRagDocument,
  onResetRagDocument,
  onRagTitleChange,
  onRagCategoryChange,
  onRagWeekChange,
  onRagContentChange,
  onUploadRagDocument,
  onDeleteRagDocument,
  onSelectWorkflowRule,
  onWorkflowNameChange,
  onWorkflowTriggerChange,
  onWorkflowRetrievalScopeChange,
  onWorkflowModelNameChange,
  onWorkflowStatusChange,
  onSaveWorkflowRule,
  onBootstrapWorkflowRule = async () => {},
  onSelectWeek,
  onWeekFieldChange,
  onWeekStatusChange,
  onUploadWeekCoverImage,
  onWeekDayChange,
  onWeekSectionChange,
  onWeekAssetChange,
  onWeekMediaChange,
  onUploadWeekMedia,
  onAddWeekDay,
  onAddWeekSection,
  onAddWeekAsset,
  onAddWeekMedia,
  onMoveWeekDay,
  onMoveWeekSection,
  onMoveWeekAsset,
  onMoveWeekMedia,
  onRemoveWeekDay,
  onRemoveWeekSection,
  onRemoveWeekAsset,
  onRemoveWeekMedia,
  onSaveWeek,
  view = "all",
}: AdminContentSectionProps) {
  if (view === "documents") {
    return (
      <AdminDocumentsSection
        ragDocuments={ragDocuments}
        selectedRagDocumentId={selectedRagDocumentId}
        contentMessage={contentMessage}
        ragTitle={ragTitle}
        ragCategory={ragCategory}
        ragWeek={ragWeek}
        ragContent={ragContent}
        isRagSubmitting={isRagSubmitting}
        onSelectRagDocument={onSelectRagDocument}
        onResetRagDocument={onResetRagDocument}
        onRagTitleChange={onRagTitleChange}
        onRagCategoryChange={onRagCategoryChange}
        onRagWeekChange={onRagWeekChange}
        onRagContentChange={onRagContentChange}
        onUploadRagDocument={onUploadRagDocument}
        onDeleteRagDocument={onDeleteRagDocument}
      />
    );
  }

  if (view === "static") {
    return (
      <AdminStaticSection
        knowledgeItems={knowledgeItems}
        selectedKnowledgeItemId={selectedKnowledgeItemId}
        contentMessage={contentMessage}
        knowledgeSlug={knowledgeSlug}
        knowledgeSection={knowledgeSection}
        knowledgeTitle={knowledgeTitle}
        knowledgeBody={knowledgeBody}
        knowledgeStatus={knowledgeStatus}
        isKnowledgeSaving={isKnowledgeSaving}
        onSelectKnowledgeItem={onSelectKnowledgeItem}
        onKnowledgeSlugChange={onKnowledgeSlugChange}
        onKnowledgeSectionChange={onKnowledgeSectionChange}
        onKnowledgeTitleChange={onKnowledgeTitleChange}
        onKnowledgeBodyChange={onKnowledgeBodyChange}
        onKnowledgeStatusChange={onKnowledgeStatusChange}
        onCreateKnowledgeItem={onCreateKnowledgeItem}
        onUpdateKnowledgeItem={onUpdateKnowledgeItem}
        onDeleteKnowledgeItem={onDeleteKnowledgeItem}
        onResetKnowledgeItem={onResetKnowledgeItem}
      />
    );
  }

  if (view === "policies") {
    return (
      <AdminPoliciesSection
        workflowRules={workflowRules}
        selectedWorkflowRuleId={selectedWorkflowRuleId}
        contentMessage={contentMessage}
        workflowName={workflowName}
        workflowTrigger={workflowTrigger}
        workflowRetrievalScope={workflowRetrievalScope}
        workflowModelName={workflowModelName}
        workflowStatus={workflowStatus}
        isWorkflowSaving={isWorkflowSaving}
        isWorkflowBootstrapping={isWorkflowBootstrapping}
        onSelectWorkflowRule={onSelectWorkflowRule}
        onWorkflowNameChange={onWorkflowNameChange}
        onWorkflowTriggerChange={onWorkflowTriggerChange}
        onWorkflowRetrievalScopeChange={onWorkflowRetrievalScopeChange}
        onWorkflowModelNameChange={onWorkflowModelNameChange}
        onWorkflowStatusChange={onWorkflowStatusChange}
        onSaveWorkflowRule={onSaveWorkflowRule}
        onBootstrapWorkflowRule={onBootstrapWorkflowRule}
      />
    );
  }

  if (view === "weeks") {
    return (
      <AdminWeeksSection
        weekSummaries={weekSummaries}
        selectedWeekNumber={selectedWeekNumber}
        selectedWeekDetail={selectedWeekDetail}
        isLoadingWeeks={isLoadingWeeks}
        isWeekSaving={isWeekSaving}
        contentMessage={contentMessage}
        uploadingCoverField={uploadingCoverField}
        uploadingMediaIndex={uploadingMediaIndex}
        onSelectWeek={onSelectWeek}
        onWeekFieldChange={onWeekFieldChange}
        onWeekStatusChange={onWeekStatusChange}
        onUploadWeekCoverImage={onUploadWeekCoverImage}
        onWeekDayChange={onWeekDayChange}
        onWeekSectionChange={onWeekSectionChange}
        onWeekAssetChange={onWeekAssetChange}
        onWeekMediaChange={onWeekMediaChange}
        onUploadWeekMedia={onUploadWeekMedia}
        onAddWeekDay={onAddWeekDay}
        onAddWeekSection={onAddWeekSection}
        onAddWeekAsset={onAddWeekAsset}
        onAddWeekMedia={onAddWeekMedia}
        onMoveWeekDay={onMoveWeekDay}
        onMoveWeekSection={onMoveWeekSection}
        onMoveWeekAsset={onMoveWeekAsset}
        onMoveWeekMedia={onMoveWeekMedia}
        onRemoveWeekDay={onRemoveWeekDay}
        onRemoveWeekSection={onRemoveWeekSection}
        onRemoveWeekAsset={onRemoveWeekAsset}
        onRemoveWeekMedia={onRemoveWeekMedia}
        onSaveWeek={onSaveWeek}
      />
    );
  }

  return null;
}
