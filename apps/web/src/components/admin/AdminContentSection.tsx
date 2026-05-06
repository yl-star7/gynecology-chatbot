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
  HomeCopyItem,
  HomeCopySlot,
  HomeCopyStatus,
} from "@gynecology-chatbot/app-core";

import {
  AdminDocumentsSection,
  type RagFileItem,
} from "./content/AdminDocumentsSection";
import { AdminPoliciesSection } from "./content/AdminPoliciesSection";
import { AdminStaticSection } from "./content/AdminStaticSection";
import { AdminWeeksSection } from "./content/AdminWeeksSection";

export interface AdminContentSectionProps {
  homeCopyItems: HomeCopyItem[];
  selectedHomeCopyItemId: string;
  knowledgeItems: AdminKnowledgeItem[];
  selectedKnowledgeItemId: string;
  homeCopySlot: HomeCopySlot;
  homeCopyVariant: string;
  homeCopyTitle: string;
  homeCopyBody: string;
  homeCopyStatus: HomeCopyStatus;
  homeCopyDisplayOrder: string;
  knowledgeSlug: string;
  knowledgeSection: AdminKnowledgeItem["section"];
  knowledgeTitle: string;
  knowledgeBody: string;
  knowledgeImageUrl: string;
  knowledgeStatus: AdminKnowledgeItem["status"];
  selectedRagDocumentId: string;
  ragDocuments: AdminDashboardData["ragDocuments"];
  ragFiles: RagFileItem[];
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
  isFileUploading: boolean;
  isHomeCopySaving: boolean;
  isKnowledgeSaving: boolean;
  isWorkflowSaving: boolean;
  isWorkflowRunning?: boolean;
  isWorkflowDeleting?: boolean;
  isWeekSaving: boolean;
  onSelectHomeCopyItem: (id: string) => void;
  onHomeCopySlotChange: (value: HomeCopySlot) => void;
  onHomeCopyVariantChange: (value: string) => void;
  onHomeCopyTitleChange: (value: string) => void;
  onHomeCopyBodyChange: (value: string) => void;
  onHomeCopyStatusChange: (value: HomeCopyStatus) => void;
  onHomeCopyDisplayOrderChange: (value: string) => void;
  onCreateHomeCopyItem: () => Promise<void>;
  onUpdateHomeCopyItem: () => Promise<void>;
  onDeleteHomeCopyItem: () => Promise<void>;
  onResetHomeCopyItem?: () => void;
  onSelectKnowledgeItem: (id: string) => void;
  onKnowledgeSlugChange: (value: string) => void;
  onKnowledgeSectionChange: (value: AdminKnowledgeItem["section"]) => void;
  onKnowledgeTitleChange: (value: string) => void;
  onKnowledgeBodyChange: (value: string) => void;
  onKnowledgeImageUrlChange: (value: string) => void;
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
  onUploadRagFile: (file: File) => Promise<void>;
  onDeleteRagFile: (fileId: string) => Promise<void>;
  onToggleRagFile: (fileId: string, enabled: boolean) => Promise<void>;
  onSelectWorkflowRule: (id: string) => void;
  onWorkflowNameChange: (value: string) => void;
  onWorkflowTriggerChange: (value: string) => void;
  onWorkflowRetrievalScopeChange: (value: string) => void;
  onWorkflowModelNameChange: (value: string) => void;
  onWorkflowStatusChange: (
    value: AdminDashboardData["workflowRules"][number]["status"],
  ) => void;
  onSaveWorkflowRule: () => Promise<void>;
  onRunWorkflowRule?: (query: string) => Promise<void>;
  onDeleteWorkflowRule?: () => Promise<void>;
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
  onPublishWeek: () => Promise<void>;
  view?: "all" | "documents" | "static" | "weeks" | "policies";
  policiesInitialView?: "list" | "editor";
}

export function AdminContentSection({
  homeCopyItems,
  selectedHomeCopyItemId,
  knowledgeItems,
  selectedKnowledgeItemId,
  homeCopySlot,
  homeCopyVariant,
  homeCopyTitle,
  homeCopyBody,
  homeCopyStatus,
  homeCopyDisplayOrder,
  knowledgeSlug,
  knowledgeSection,
  knowledgeTitle,
  knowledgeBody,
  knowledgeImageUrl,
  knowledgeStatus,
  selectedRagDocumentId,
  ragDocuments,
  ragFiles,
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
  isFileUploading,
  isHomeCopySaving,
  isKnowledgeSaving,
  isWorkflowSaving,
  isWorkflowRunning = false,
  isWorkflowDeleting = false,
  isWeekSaving,
  onSelectHomeCopyItem,
  onHomeCopySlotChange,
  onHomeCopyVariantChange,
  onHomeCopyTitleChange,
  onHomeCopyBodyChange,
  onHomeCopyStatusChange,
  onHomeCopyDisplayOrderChange,
  onCreateHomeCopyItem,
  onUpdateHomeCopyItem,
  onDeleteHomeCopyItem,
  onResetHomeCopyItem = () => {},
  onSelectKnowledgeItem,
  onKnowledgeSlugChange,
  onKnowledgeSectionChange,
  onKnowledgeTitleChange,
  onKnowledgeBodyChange,
  onKnowledgeImageUrlChange,
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
  onUploadRagFile,
  onDeleteRagFile,
  onToggleRagFile,
  onSelectWorkflowRule,
  onWorkflowNameChange,
  onWorkflowTriggerChange,
  onWorkflowRetrievalScopeChange,
  onWorkflowModelNameChange,
  onWorkflowStatusChange,
  onSaveWorkflowRule,
  onRunWorkflowRule = async () => {},
  onDeleteWorkflowRule = async () => {},
  onSelectWeek,
  onWeekFieldChange,
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
  onPublishWeek,
  view = "all",
  policiesInitialView = "list",
}: AdminContentSectionProps) {
  if (view === "documents") {
    return (
      <AdminDocumentsSection
        ragDocuments={ragDocuments}
        ragFiles={ragFiles}
        selectedRagDocumentId={selectedRagDocumentId}
        contentMessage={contentMessage}
        ragTitle={ragTitle}
        ragCategory={ragCategory}
        ragWeek={ragWeek}
        ragContent={ragContent}
        isRagSubmitting={isRagSubmitting}
        isFileUploading={isFileUploading}
        onSelectRagDocument={onSelectRagDocument}
        onResetRagDocument={onResetRagDocument}
        onRagTitleChange={onRagTitleChange}
        onRagCategoryChange={onRagCategoryChange}
        onRagWeekChange={onRagWeekChange}
        onRagContentChange={onRagContentChange}
        onUploadRagDocument={onUploadRagDocument}
        onDeleteRagDocument={onDeleteRagDocument}
        onUploadRagFile={onUploadRagFile}
        onDeleteRagFile={onDeleteRagFile}
        onToggleRagFile={onToggleRagFile}
      />
    );
  }

  if (view === "static") {
    return (
      <AdminStaticSection
        homeCopyItems={homeCopyItems}
        selectedHomeCopyItemId={selectedHomeCopyItemId}
        knowledgeItems={knowledgeItems}
        selectedKnowledgeItemId={selectedKnowledgeItemId}
        contentMessage={contentMessage}
        homeCopySlot={homeCopySlot}
        homeCopyVariant={homeCopyVariant}
        homeCopyTitle={homeCopyTitle}
        homeCopyBody={homeCopyBody}
        homeCopyStatus={homeCopyStatus}
        homeCopyDisplayOrder={homeCopyDisplayOrder}
        knowledgeSlug={knowledgeSlug}
        knowledgeSection={knowledgeSection}
        knowledgeTitle={knowledgeTitle}
        knowledgeBody={knowledgeBody}
        knowledgeImageUrl={knowledgeImageUrl}
        knowledgeStatus={knowledgeStatus}
        isHomeCopySaving={isHomeCopySaving}
        isKnowledgeSaving={isKnowledgeSaving}
        onSelectHomeCopyItem={onSelectHomeCopyItem}
        onHomeCopySlotChange={onHomeCopySlotChange}
        onHomeCopyVariantChange={onHomeCopyVariantChange}
        onHomeCopyTitleChange={onHomeCopyTitleChange}
        onHomeCopyBodyChange={onHomeCopyBodyChange}
        onHomeCopyStatusChange={onHomeCopyStatusChange}
        onHomeCopyDisplayOrderChange={onHomeCopyDisplayOrderChange}
        onCreateHomeCopyItem={onCreateHomeCopyItem}
        onUpdateHomeCopyItem={onUpdateHomeCopyItem}
        onDeleteHomeCopyItem={onDeleteHomeCopyItem}
        onResetHomeCopyItem={onResetHomeCopyItem}
        onSelectKnowledgeItem={onSelectKnowledgeItem}
        onKnowledgeSlugChange={onKnowledgeSlugChange}
        onKnowledgeSectionChange={onKnowledgeSectionChange}
        onKnowledgeTitleChange={onKnowledgeTitleChange}
        onKnowledgeBodyChange={onKnowledgeBodyChange}
        onKnowledgeImageUrlChange={onKnowledgeImageUrlChange}
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
        isWorkflowRunning={isWorkflowRunning}
        isWorkflowDeleting={isWorkflowDeleting}
        onSelectWorkflowRule={onSelectWorkflowRule}
        onWorkflowNameChange={onWorkflowNameChange}
        onWorkflowTriggerChange={onWorkflowTriggerChange}
        onWorkflowRetrievalScopeChange={onWorkflowRetrievalScopeChange}
        onWorkflowModelNameChange={onWorkflowModelNameChange}
        onWorkflowStatusChange={onWorkflowStatusChange}
        onSaveWorkflowRule={onSaveWorkflowRule}
        onRunWorkflowRule={onRunWorkflowRule}
        onDeleteWorkflowRule={onDeleteWorkflowRule}
        initialView={policiesInitialView}
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
        onPublishWeek={onPublishWeek}
      />
    );
  }

  return null;
}
