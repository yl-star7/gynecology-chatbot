"use client";

import { useState } from "react";

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

import {
  getDocumentStatusBadge,
  getDocumentStatusLabel,
  getWeekStatusBadge,
  getWeekStatusLabel,
  getWorkflowStatusBadge,
  getWorkflowStatusLabel,
} from "./admin-dashboard-labels";
import styles from "./AdminConsoleLayout.module.css";

function WeekImagePreview({ src, alt }: { src: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={styles.imagePlaceholder}>이미지를 불러오지 못했어요.</div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.imagePreview}
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
}

interface AdminContentSectionProps {
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
  const readyDocuments = ragDocuments.filter(
    (document) => document.status === "ready",
  ).length;
  const draftDocuments = ragDocuments.filter(
    (document) => document.status === "draft",
  ).length;
  const selectedRagDocument =
    ragDocuments.find((document) => document.id === selectedRagDocumentId) ??
    null;
  const selectedKnowledgeItem =
    knowledgeItems.find((item) => item.id === selectedKnowledgeItemId) ?? null;
  const selectedWorkflowRule =
    workflowRules.find((rule) => rule.id === selectedWorkflowRuleId) ?? null;
  const [activeContentOverlay, setActiveContentOverlay] = useState<
    "knowledge" | "document" | "workflow" | "week" | null
  >(null);
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [knowledgeStatusFilter, setKnowledgeStatusFilter] = useState("all");
  const [documentQuery, setDocumentQuery] = useState("");
  const [documentStatusFilter, setDocumentStatusFilter] = useState("all");
  const [weekQuery, setWeekQuery] = useState("");
  const [weekStatusFilter, setWeekStatusFilter] = useState("all");
  const [workflowQuery, setWorkflowQuery] = useState("");
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState("all");
  const publicStorageBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public`
    : null;

  function resolveImagePreviewSrc(path: string | null | undefined) {
    const trimmed = path?.trim();
    if (!trimmed) {
      return null;
    }

    if (
      trimmed.startsWith("/") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    ) {
      return trimmed;
    }

    if (trimmed.startsWith("storage://")) {
      if (!publicStorageBaseUrl) {
        return null;
      }

      const normalized = trimmed.replace("storage://", "");
      const slashIndex = normalized.indexOf("/");
      if (slashIndex === -1) {
        return null;
      }

      const bucketId = normalized.slice(0, slashIndex).trim();
      const objectPath = normalized.slice(slashIndex + 1).trim();
      if (!bucketId || !objectPath) {
        return null;
      }

      return `${publicStorageBaseUrl}/${bucketId}/${objectPath}`;
    }

    return null;
  }

  const filteredKnowledgeItems = knowledgeItems.filter((item) => {
    const matchesQuery =
      !knowledgeQuery.trim() ||
      item.title.toLowerCase().includes(knowledgeQuery.trim().toLowerCase()) ||
      item.slug.toLowerCase().includes(knowledgeQuery.trim().toLowerCase());
    const matchesStatus =
      knowledgeStatusFilter === "all" || item.status === knowledgeStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const filteredRagDocuments = ragDocuments.filter((document) => {
    const query = documentQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      document.title.toLowerCase().includes(query) ||
      document.category.toLowerCase().includes(query);
    const matchesStatus =
      documentStatusFilter === "all" || document.status === documentStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const filteredWorkflowRules = workflowRules.filter((rule) => {
    const query = workflowQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      rule.name.toLowerCase().includes(query) ||
      rule.trigger.toLowerCase().includes(query) ||
      rule.modelName.toLowerCase().includes(query);
    const matchesStatus =
      workflowStatusFilter === "all" || rule.status === workflowStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const filteredWeekSummaries = weekSummaries.filter((week) => {
    const query = weekQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      `${week.weekNumber}주차`.toLowerCase().includes(query) ||
      week.title.toLowerCase().includes(query) ||
      (week.babySizeLabel ?? "").toLowerCase().includes(query);
    const matchesStatus =
      weekStatusFilter === "all" || week.status === weekStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const selectedWeekOverview = selectedWeekDetail
    ? {
        dayCount: selectedWeekDetail.days.length,
        checklistCount: selectedWeekDetail.sections.length,
        questionCount: selectedWeekDetail.assets.length,
        mediaCount: selectedWeekDetail.media.length,
      }
    : null;

  const selectedWeekDayRows = selectedWeekDetail
    ? [...selectedWeekDetail.days]
        .sort((left, right) => left.dayNumber - right.dayNumber)
        .map((day) => {
          const checklistCount = selectedWeekDetail.sections.filter(
            (section) => section.dayNumber === day.dayNumber,
          ).length;
          const questionCount = selectedWeekDetail.assets.filter(
            (asset) => asset.dayNumber === day.dayNumber,
          ).length;
          const hasFetalCopy = day.babyDevelopmentItems.some((item) =>
            item.trim(),
          );
          const hasMaternalCopy = day.motherChangesItems.some((item) =>
            item.trim(),
          );
          const status = hasFetalCopy && hasMaternalCopy && checklistCount > 0 && questionCount > 0
            ? "complete"
            : hasFetalCopy || hasMaternalCopy || checklistCount > 0 || questionCount > 0
              ? "partial"
              : "empty";

          return {
            id: day.id || `day-${day.dayNumber}`,
            dayNumber: day.dayNumber,
            title: day.title?.trim() || `Day ${day.dayNumber}`,
            fetalCount: day.babyDevelopmentItems.filter((item) => item.trim()).length,
            maternalCount: day.motherChangesItems.filter((item) => item.trim()).length,
            checklistCount,
            questionCount,
            babyMessage: day.babyMessage?.trim() ?? "",
            status,
          };
        })
    : [];

  const selectedWeekReferenceMedia = selectedWeekDetail?.media.find(
    (media) =>
      media.mediaScope === "week" &&
      (media.mediaRole === "reference" ||
        media.mediaRole === "compare" ||
        media.mediaRole === "hero"),
  );

  if (view === "documents") {
    return (
      <section className={styles.sectionStack}>
        <section className={styles.panel}>
          <div className={styles.routeHeader}>
            <div>
              <h2 className={styles.routeTitle}>지식 문서</h2>
              <p className={styles.panelDescription}>
                참고 자료를 빠르게 찾고, 행 클릭으로 우측 편집 패널을 엽니다.
              </p>
            </div>
            <div className={styles.topbarActions}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={onResetRagDocument}
              >
                초안 비우기
              </button>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  onResetRagDocument();
                  setActiveContentOverlay("document");
                }}
              >
                새 자료
              </button>
            </div>
          </div>

          <div className={styles.tableToolbar}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>검색</span>
              <input
                className={styles.fieldInput}
                value={documentQuery}
                onChange={(event) => setDocumentQuery(event.target.value)}
                placeholder="제목 또는 카테고리"
              />
            </label>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>상태</span>
              <select
                className={styles.fieldSelect}
                value={documentStatusFilter}
                onChange={(event) => setDocumentStatusFilter(event.target.value)}
              >
                <option value="all">전체</option>
                <option value="ready">배포 가능</option>
                <option value="draft">작성 중</option>
              </select>
            </label>
          </div>

          <div className={styles.dataTable}>
            <div className={styles.dataTableHeader}>
              <span>자료명</span>
              <span>카테고리</span>
              <span>상태</span>
              <span>청크</span>
              <span>최근 수정</span>
            </div>
            {filteredRagDocuments.map((document) => (
              <button
                key={document.id}
                className={`${styles.dataTableRow} ${
                  selectedRagDocumentId === document.id
                    ? styles.dataTableRowActive
                    : ""
                }`}
                type="button"
                onClick={() => {
                  void onSelectRagDocument(document.id);
                  setActiveContentOverlay("document");
                }}
              >
                <span className={styles.dataTableTitleGroup}>
                  <strong>{document.title}</strong>
                  <small>{document.pregnancyWeekLabel}</small>
                </span>
                <span>{document.category}</span>
                <span>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[getDocumentStatusBadge(document.status)] ?? ""
                    }`}
                  >
                    {getDocumentStatusLabel(document.status)}
                  </span>
                </span>
                <span>{document.chunkCount}</span>
                <span>{document.updatedAt}</span>
              </button>
            ))}
            {filteredRagDocuments.length === 0 ? (
              <div className={styles.listEmpty}>조건에 맞는 자료가 없습니다.</div>
            ) : null}
          </div>
        </section>

        {activeContentOverlay === "document" ? (
          <>
            <button
              aria-label="패널 닫기"
              className={styles.overlayBackdrop}
              type="button"
              onClick={() => setActiveContentOverlay(null)}
            />
            <aside className={styles.overlayPanel}>
              <div className={styles.overlayHeader}>
                <div>
                  <h3 className={styles.panelTitle}>
                    {selectedRagDocument ? "자료 편집" : "새 자료"}
                  </h3>
                  <p className={styles.panelDescription}>
                    제목, 분류, 주차, 본문을 수정하고 바로 저장합니다.
                  </p>
                </div>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setActiveContentOverlay(null)}
                >
                  닫기
                </button>
              </div>
              <div className={styles.overlayBody}>
                {contentMessage ? <p className={styles.formHint}>{contentMessage}</p> : null}
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>자료 제목</span>
                  <input
                    className={styles.fieldInput}
                    value={ragTitle}
                    onChange={(event) => onRagTitleChange(event.target.value)}
                  />
                </label>
                <div className={styles.panelGrid}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>카테고리</span>
                    <input
                      className={styles.fieldInput}
                      value={ragCategory}
                      onChange={(event) => onRagCategoryChange(event.target.value)}
                    />
                  </label>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>주차</span>
                    <input
                      className={styles.fieldInput}
                      inputMode="numeric"
                      value={ragWeek}
                      onChange={(event) => onRagWeekChange(event.target.value)}
                    />
                  </label>
                </div>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>자료 내용</span>
                  <textarea
                    className={styles.overlayTextarea}
                    value={ragContent}
                    onChange={(event) => onRagContentChange(event.target.value)}
                  />
                </label>
              </div>
              <div className={styles.overlayFooter}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={isRagSubmitting}
                  onClick={onResetRagDocument}
                >
                  비우기
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={isRagSubmitting || !selectedRagDocumentId}
                  onClick={onDeleteRagDocument}
                >
                  삭제
                </button>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={isRagSubmitting}
                  onClick={onUploadRagDocument}
                >
                  {selectedRagDocumentId ? "자료 저장" : "자료 반영"}
                </button>
              </div>
            </aside>
          </>
        ) : null}
      </section>
    );
  }

  if (view === "static") {
    return (
      <section className={styles.sectionStack}>
        <section className={styles.panel}>
          <div className={styles.routeHeader}>
            <div>
              <h2 className={styles.routeTitle}>주차별 간호 정보</h2>
              <p className={styles.panelDescription}>
                주차별 간호 정보에 함께 쓰는 고정 안내문을 관리하고, 상세 수정은 우측 패널에서 처리합니다.
              </p>
            </div>
            <div className={styles.topbarActions}>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  onResetKnowledgeItem();
                  setActiveContentOverlay("knowledge");
                }}
              >
                새 안내문
              </button>
            </div>
          </div>

          <div className={styles.tableToolbar}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>검색</span>
              <input
                className={styles.fieldInput}
                value={knowledgeQuery}
                onChange={(event) => setKnowledgeQuery(event.target.value)}
                placeholder="제목 또는 슬러그"
              />
            </label>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>상태</span>
              <select
                className={styles.fieldSelect}
                value={knowledgeStatusFilter}
                onChange={(event) => setKnowledgeStatusFilter(event.target.value)}
              >
                <option value="all">전체</option>
                <option value="draft">초안</option>
                <option value="published">게시중</option>
                <option value="archived">보관</option>
              </select>
            </label>
          </div>

          <div className={styles.dataTable}>
            <div className={styles.dataTableHeader}>
              <span>제목</span>
              <span>슬러그</span>
              <span>섹션</span>
              <span>상태</span>
              <span>최근 수정</span>
            </div>
            {filteredKnowledgeItems.map((item) => (
              <button
                key={item.id}
                className={`${styles.dataTableRow} ${
                  selectedKnowledgeItemId === item.id
                    ? styles.dataTableRowActive
                    : ""
                }`}
                type="button"
                onClick={() => {
                  onSelectKnowledgeItem(item.id);
                  setActiveContentOverlay("knowledge");
                }}
              >
                <span className={styles.dataTableTitleGroup}>
                  <strong>{item.title}</strong>
                </span>
                <span>{item.slug}</span>
                <span>{item.section}</span>
                <span>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[getWeekStatusBadge(item.status)] ?? ""
                    }`}
                  >
                    {getWeekStatusLabel(item.status)}
                  </span>
                </span>
                <span>{item.updatedAt}</span>
              </button>
            ))}
            {filteredKnowledgeItems.length === 0 ? (
              <div className={styles.listEmpty}>조건에 맞는 안내문이 없습니다.</div>
            ) : null}
          </div>
        </section>

        {activeContentOverlay === "knowledge" ? (
          <>
            <button
              aria-label="패널 닫기"
              className={styles.overlayBackdrop}
              type="button"
              onClick={() => setActiveContentOverlay(null)}
            />
            <aside className={styles.overlayPanel}>
              <div className={styles.overlayHeader}>
                <div>
                  <h3 className={styles.panelTitle}>
                    {selectedKnowledgeItem ? "안내문 편집" : "새 안내문"}
                  </h3>
                  <p className={styles.panelDescription}>
                    이름, 상태, 본문을 한 패널 안에서 수정합니다.
                  </p>
                </div>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setActiveContentOverlay(null)}
                >
                  닫기
                </button>
              </div>
              <div className={styles.overlayBody}>
                {contentMessage ? <p className={styles.formHint}>{contentMessage}</p> : null}
                <div className={styles.panelGrid}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>슬러그</span>
                    <input
                      className={styles.fieldInput}
                      value={knowledgeSlug}
                      onChange={(event) => onKnowledgeSlugChange(event.target.value)}
                    />
                  </label>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>섹션</span>
                    <select
                      className={styles.fieldSelect}
                      value={knowledgeSection}
                      onChange={(event) =>
                        onKnowledgeSectionChange(
                          event.target.value as AdminKnowledgeItem["section"],
                        )
                      }
                    >
                      <option value="knowledge">knowledge</option>
                      <option value="notebook">notebook</option>
                    </select>
                  </label>
                </div>
                <div className={styles.panelGrid}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>제목</span>
                    <input
                      className={styles.fieldInput}
                      value={knowledgeTitle}
                      onChange={(event) => onKnowledgeTitleChange(event.target.value)}
                    />
                  </label>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>상태</span>
                    <select
                      className={styles.fieldSelect}
                      value={knowledgeStatus}
                      onChange={(event) =>
                        onKnowledgeStatusChange(
                          event.target.value as AdminKnowledgeItem["status"],
                        )
                      }
                    >
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>
                </div>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>본문</span>
                  <textarea
                    className={styles.overlayTextarea}
                    value={knowledgeBody}
                    onChange={(event) => onKnowledgeBodyChange(event.target.value)}
                  />
                </label>
              </div>
              <div className={styles.overlayFooter}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={isKnowledgeSaving}
                  onClick={onResetKnowledgeItem}
                >
                  비우기
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={isKnowledgeSaving || !selectedKnowledgeItemId}
                  onClick={onDeleteKnowledgeItem}
                >
                  삭제
                </button>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={isKnowledgeSaving}
                  onClick={
                    selectedKnowledgeItemId
                      ? onUpdateKnowledgeItem
                      : onCreateKnowledgeItem
                  }
                >
                  {selectedKnowledgeItemId ? "안내문 저장" : "안내문 생성"}
                </button>
              </div>
            </aside>
          </>
        ) : null}
      </section>
    );
  }

  if (view === "policies") {
    return (
      <section className={styles.sectionStack}>
        <section className={styles.panel}>
          <div className={styles.routeHeader}>
            <div>
              <h2 className={styles.routeTitle}>응답 워크플로우</h2>
              <p className={styles.panelDescription}>
                상담 응답 흐름을 검색하고, 우측 패널에서 세부 규칙을 수정합니다.
              </p>
            </div>
            <div className={styles.topbarActions}>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isWorkflowBootstrapping}
                onClick={() => void onBootstrapWorkflowRule()}
              >
                {isWorkflowBootstrapping
                  ? "기본 워크플로우 만드는 중"
                  : "기본 워크플로우 만들기"}
              </button>
            </div>
          </div>

          <div className={styles.tableToolbar}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>검색</span>
              <input
                className={styles.fieldInput}
                value={workflowQuery}
                onChange={(event) => setWorkflowQuery(event.target.value)}
                placeholder="워크플로우 이름, 트리거, 모델"
              />
            </label>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>상태</span>
              <select
                className={styles.fieldSelect}
                value={workflowStatusFilter}
                onChange={(event) => setWorkflowStatusFilter(event.target.value)}
              >
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="review">검토중</option>
              </select>
            </label>
          </div>

          <div className={styles.dataTable}>
            <div className={styles.dataTableHeader}>
              <span>워크플로우</span>
              <span>트리거</span>
              <span>검색 범위</span>
              <span>모델</span>
              <span>상태</span>
            </div>
            {filteredWorkflowRules.map((rule) => (
              <button
                key={rule.id}
                className={`${styles.dataTableRow} ${
                  selectedWorkflowRuleId === rule.id
                    ? styles.dataTableRowActive
                    : ""
                }`}
                type="button"
                onClick={() => {
                  onSelectWorkflowRule(rule.id);
                  setActiveContentOverlay("workflow");
                }}
              >
                <span className={styles.dataTableTitleGroup}>
                  <strong>{rule.name}</strong>
                </span>
                <span>{rule.trigger}</span>
                <span>{rule.retrievalScope}</span>
                <span>{rule.modelName}</span>
                <span>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[getWorkflowStatusBadge(rule.status)] ?? ""
                    }`}
                  >
                    {getWorkflowStatusLabel(rule.status)}
                  </span>
                </span>
              </button>
            ))}
            {filteredWorkflowRules.length === 0 ? (
              <div className={styles.listEmpty}>조건에 맞는 워크플로우가 없습니다.</div>
            ) : null}
          </div>
        </section>

        {activeContentOverlay === "workflow" ? (
          <>
            <button
              aria-label="패널 닫기"
              className={styles.overlayBackdrop}
              type="button"
              onClick={() => setActiveContentOverlay(null)}
            />
            <aside className={styles.overlayPanel}>
              <div className={styles.overlayHeader}>
                <div>
                  <h3 className={styles.panelTitle}>워크플로우 편집</h3>
                  <p className={styles.panelDescription}>
                    트리거, 검색 범위, 모델을 수정하고 저장합니다.
                  </p>
                </div>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setActiveContentOverlay(null)}
                >
                  닫기
                </button>
              </div>
              <div className={styles.overlayBody}>
                {contentMessage ? <p className={styles.formHint}>{contentMessage}</p> : null}
                {selectedWorkflowRule ? (
                  <div className={styles.detailGrid}>
                    <div className={styles.panelStat}>
                      <span className={styles.metaLabel}>선택 워크플로우</span>
                      <strong>{selectedWorkflowRule.name}</strong>
                    </div>
                    <div className={styles.panelStat}>
                      <span className={styles.metaLabel}>현재 상태</span>
                      <strong>
                        {getWorkflowStatusLabel(selectedWorkflowRule.status)}
                      </strong>
                    </div>
                  </div>
                ) : null}
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>워크플로우 이름</span>
                  <input
                    className={styles.fieldInput}
                    value={workflowName}
                    onChange={(event) => onWorkflowNameChange(event.target.value)}
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>트리거</span>
                  <input
                    className={styles.fieldInput}
                    value={workflowTrigger}
                    onChange={(event) => onWorkflowTriggerChange(event.target.value)}
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>검색 범위</span>
                  <input
                    className={styles.fieldInput}
                    value={workflowRetrievalScope}
                    onChange={(event) =>
                      onWorkflowRetrievalScopeChange(event.target.value)
                    }
                  />
                </label>
                <div className={styles.panelGrid}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>모델</span>
                    <input
                      className={styles.fieldInput}
                      value={workflowModelName}
                      onChange={(event) => onWorkflowModelNameChange(event.target.value)}
                    />
                  </label>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>상태</span>
                    <select
                      className={styles.fieldSelect}
                      value={workflowStatus}
                      onChange={(event) =>
                        onWorkflowStatusChange(
                          event.target.value as AdminDashboardData["workflowRules"][number]["status"],
                        )
                      }
                    >
                      <option value="active">active</option>
                      <option value="review">review</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className={styles.overlayFooter}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={isWorkflowSaving || !selectedWorkflowRuleId}
                  onClick={onSaveWorkflowRule}
                >
                  워크플로우 저장
                </button>
              </div>
            </aside>
          </>
        ) : null}
      </section>
    );
  }

  if (view === "weeks") {
    return (
      <section className={styles.sectionStack}>
        <section className={styles.weekWorkspace}>
          <aside className={styles.weekRail}>
            <section className={styles.panel}>
              <div className={styles.tableToolbar}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>주차 찾기</span>
                  <input
                    className={styles.fieldInput}
                    value={weekQuery}
                    onChange={(event) => setWeekQuery(event.target.value)}
                    placeholder="주차, 제목, 아기 크기"
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>상태</span>
                  <select
                    className={styles.fieldSelect}
                    value={weekStatusFilter}
                    onChange={(event) => setWeekStatusFilter(event.target.value)}
                  >
                    <option value="all">전체</option>
                    <option value="draft">초안</option>
                    <option value="published">게시중</option>
                    <option value="archived">보관</option>
                  </select>
                </label>
              </div>

              <div className={styles.weekRegistry}>
                {filteredWeekSummaries.map((week) => (
                  <button
                    key={week.id}
                    className={`${styles.weekRegistryRow} ${
                      selectedWeekNumber === week.weekNumber
                        ? styles.weekRegistryRowActive
                        : ""
                    }`}
                    type="button"
                    onClick={() => onSelectWeek(week.weekNumber)}
                  >
                    <div className={styles.weekRegistryPrimary}>
                      <strong>{week.weekNumber}주차</strong>
                      <span>{week.title}</span>
                    </div>
                    <div className={styles.weekRegistryMeta}>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[getWeekStatusBadge(week.status)] ?? ""
                        }`}
                      >
                        {getWeekStatusLabel(week.status)}
                      </span>
                      <small>{week.updatedAt}</small>
                    </div>
                  </button>
                ))}
                {filteredWeekSummaries.length === 0 ? (
                  <div className={styles.listEmpty}>
                    {isLoadingWeeks
                      ? "주차 목록을 불러오는 중입니다."
                      : "조건에 맞는 주차가 없습니다."}
                  </div>
                ) : null}
              </div>
            </section>
          </aside>

          <div className={styles.weekWorkspaceMain}>
            {selectedWeekDetail ? (
              <>
                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h3 className={styles.panelTitle}>
                        {selectedWeekDetail.weekNumber}주차 개요
                      </h3>
                      <p className={styles.panelDescription}>
                        주차 메타와 핵심 요약을 먼저 확인한 뒤, 아래 Day 1~7 레지스트리에서 누락된
                        섹션을 검수합니다.
                      </p>
                    </div>
                    <div className={styles.topbarActions}>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={() => setActiveContentOverlay("week")}
                      >
                        상세 편집 열기
                      </button>
                    </div>
                  </div>

                  <div className={styles.weekHeroGrid}>
                    <div className={styles.weekHeroPrimary}>
                      <div className={styles.weekHeroHeading}>
                        <span className={styles.metaLabel}>선택 주차</span>
                        <h4>{selectedWeekDetail.title}</h4>
                      </div>
                      <div className={styles.badgeRow}>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[getWeekStatusBadge(selectedWeekDetail.status)] ?? ""
                          }`}
                        >
                          {getWeekStatusLabel(selectedWeekDetail.status)}
                        </span>
                        <span className={styles.tag}>
                          아기 크기 {selectedWeekDetail.babySizeLabel || "-"}
                        </span>
                        <span className={styles.tag}>
                          비교 {selectedWeekDetail.babySizeCompareObject || "-"}
                        </span>
                      </div>
                      <div className={styles.weekSummaryGrid}>
                        <article className={styles.weekSummaryCard}>
                          <span className={styles.metaLabel}>오늘 아기는요</span>
                          <p>{selectedWeekDetail.babySummary}</p>
                        </article>
                        <article className={styles.weekSummaryCard}>
                          <span className={styles.metaLabel}>오늘 엄마는요</span>
                          <p>{selectedWeekDetail.motherSummary}</p>
                        </article>
                      </div>
                    </div>

                    <div className={styles.weekHeroMeta}>
                      <div className={styles.panelStat}>
                        <span className={styles.metaLabel}>Day 수</span>
                        <strong>{selectedWeekOverview?.dayCount ?? 0}</strong>
                      </div>
                      <div className={styles.panelStat}>
                        <span className={styles.metaLabel}>체크리스트</span>
                        <strong>{selectedWeekOverview?.checklistCount ?? 0}</strong>
                      </div>
                      <div className={styles.panelStat}>
                        <span className={styles.metaLabel}>질문</span>
                        <strong>{selectedWeekOverview?.questionCount ?? 0}</strong>
                      </div>
                      <div className={styles.panelStat}>
                        <span className={styles.metaLabel}>이미지</span>
                        <strong>{selectedWeekOverview?.mediaCount ?? 0}</strong>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h3 className={styles.panelTitle}>Day 1~7 검수</h3>
                      <p className={styles.panelDescription}>
                        원문 구조대로 Day를 펼쳐 보고, 태아 발달정보·모체 변화정보·생활 체크리스트·태교 질문의 충족 상태를 빠르게 확인합니다.
                      </p>
                    </div>
                  </div>

                  <div className={styles.weekDayList}>
                    {selectedWeekDayRows.map((day) => (
                      <article key={day.id} className={styles.weekDayRow}>
                        <div className={styles.weekDayLead}>
                          <div>
                            <span className={styles.metaLabel}>Day {day.dayNumber}</span>
                            <h4>{day.title}</h4>
                          </div>
                          <span
                            className={`${styles.statusBadge} ${
                              day.status === "complete"
                                ? styles.statusSuccess
                                : day.status === "partial"
                                  ? styles.statusWarning
                                  : styles.statusMuted
                            }`}
                          >
                            {day.status === "complete"
                              ? "검수 가능"
                              : day.status === "partial"
                                ? "보완 필요"
                                : "미작성"}
                          </span>
                        </div>

                        <div className={styles.weekDaySections}>
                          <div className={styles.weekDaySectionCell}>
                            <strong>태아 발달정보</strong>
                            <span>{day.fetalCount}개 문단</span>
                          </div>
                          <div className={styles.weekDaySectionCell}>
                            <strong>모체 변화정보</strong>
                            <span>{day.maternalCount}개 문단</span>
                          </div>
                          <div className={styles.weekDaySectionCell}>
                            <strong>생활 체크리스트</strong>
                            <span>{day.checklistCount}개 항목</span>
                          </div>
                          <div className={styles.weekDaySectionCell}>
                            <strong>태교 질문</strong>
                            <span>{day.questionCount}개 항목</span>
                          </div>
                        </div>

                        {day.babyMessage ? (
                          <p className={styles.weekDayMessage}>
                            <span className={styles.metaLabel}>아기의 말</span>
                            {day.babyMessage}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <section className={styles.panel}>
                <div className={styles.listEmpty}>
                  {isLoadingWeeks
                    ? "주차 상세를 불러오는 중입니다."
                    : "왼쪽에서 주차를 선택하면 주차 개요와 Day 검수 보드가 열립니다."}
                </div>
              </section>
            )}
          </div>
        </section>

        {renderWeekOverlay()}
      </section>
    );
  }

  function renderWeekOverlay() {
    if (activeContentOverlay !== "week") {
      return null;
    }

    return (
      <>
        <button
          aria-label="패널 닫기"
          className={styles.overlayBackdrop}
          type="button"
          onClick={() => setActiveContentOverlay(null)}
        />
        <aside className={`${styles.overlayPanel} ${styles.overlayPanelWide}`}>
          <div className={styles.overlayHeader}>
            <div>
              <h3 className={styles.panelTitle}>
                {selectedWeekDetail
                  ? `${selectedWeekDetail.weekNumber}주차 편집`
                  : "주차 편집"}
              </h3>
              <p className={styles.panelDescription}>
                대표 요약과 이미지를 먼저 확인하고, 아래에서 day와 세부 데이터를 이어서 수정합니다.
              </p>
            </div>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => setActiveContentOverlay(null)}
            >
              닫기
            </button>
          </div>
          <div className={styles.overlayBody}>
            {contentMessage ? <p className={styles.formHint}>{contentMessage}</p> : null}
            {selectedWeekDetail ? (
              <>
                <div className={styles.detailGrid}>
                  <div className={styles.panelStat}>
                    <span className={styles.metaLabel}>선택 주차</span>
                    <strong>{selectedWeekDetail.weekNumber}주차</strong>
                  </div>
                  <div className={styles.panelStat}>
                    <span className={styles.metaLabel}>현재 상태</span>
                    <strong>{getWeekStatusLabel(selectedWeekDetail.status)}</strong>
                  </div>
                  <div className={styles.panelStat}>
                    <span className={styles.metaLabel}>Day 수</span>
                    <strong>{selectedWeekDetail.days.length}</strong>
                  </div>
                  <div className={styles.panelStat}>
                    <span className={styles.metaLabel}>최근 수정</span>
                    <strong>{selectedWeekDetail.updatedAt}</strong>
                  </div>
                </div>

                <div className={styles.panelGrid}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>주차 제목</span>
                    <input
                      className={styles.fieldInput}
                      value={selectedWeekDetail.title}
                      onChange={(event) =>
                        onWeekFieldChange("title", event.target.value)
                      }
                    />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>상태</span>
                    <select
                      className={styles.fieldSelect}
                      value={selectedWeekDetail.status}
                      onChange={(event) =>
                        onWeekStatusChange(
                          event.target.value as AdminWeekDetail["status"],
                        )
                      }
                    >
                      <option value="draft">초안</option>
                      <option value="published">게시됨</option>
                      <option value="archived">보관됨</option>
                    </select>
                  </label>
                </div>

                <div className={styles.panelGrid}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>아기 크기 라벨</span>
                    <input
                      className={styles.fieldInput}
                      value={selectedWeekDetail.babySizeLabel ?? ""}
                      onChange={(event) =>
                        onWeekFieldChange("babySizeLabel", event.target.value)
                      }
                    />
                  </label>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>비교 오브젝트</span>
                    <input
                      className={styles.fieldInput}
                      value={selectedWeekDetail.babySizeCompareObject ?? ""}
                      onChange={(event) =>
                        onWeekFieldChange(
                          "babySizeCompareObject",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                </div>

                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>아기 요약</span>
                  <textarea
                    className={styles.fieldTextarea}
                    value={selectedWeekDetail.babySummary}
                    onChange={(event) =>
                      onWeekFieldChange("babySummary", event.target.value)
                    }
                  />
                </label>

                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>산모 요약</span>
                  <textarea
                    className={styles.fieldTextarea}
                    value={selectedWeekDetail.motherSummary}
                    onChange={(event) =>
                      onWeekFieldChange("motherSummary", event.target.value)
                    }
                  />
                </label>

                <div className={styles.panelGrid}>
                  {renderWeekImageField({
                    field: "heroImagePath",
                    label: "주차 대표 이미지",
                    value: selectedWeekDetail.heroImagePath,
                  })}
                  {renderWeekImageField({
                    field: "compareImagePath",
                    label: "비교 이미지",
                    value: selectedWeekDetail.compareImagePath,
                  })}
                </div>

                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.panelTitle}>Day별 본문</h3>
                    <p className={styles.panelDescription}>
                      주차 안의 `Day 1~7` 본문과 아기/산모 문구를 직접 수정합니다.
                    </p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={onAddWeekDay}
                    aria-label="Day 추가"
                  >
                    Day 추가
                  </button>
                </div>

                <div className={styles.list}>
                  {selectedWeekDetail.days.map((day, index) => (
                    <div
                      key={day.id || `new-day-${index}`}
                      className={`${styles.listRow} ${styles.editorListRow}`}
                    >
                      <div className={styles.listDetail}>
                        <div className={styles.panelGrid}>
                          <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Day 번호</span>
                            <input
                              className={styles.fieldInput}
                              inputMode="numeric"
                              value={day.dayNumber}
                              onChange={(event) =>
                                onWeekDayChange(
                                  index,
                                  "dayNumber",
                                  Number(event.target.value) || 1,
                                )
                              }
                            />
                          </label>
                          <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>제목</span>
                            <input
                              className={styles.fieldInput}
                              value={day.title}
                              onChange={(event) =>
                                onWeekDayChange(index, "title", event.target.value)
                              }
                            />
                          </label>
                        </div>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>아기 발달 항목</span>
                          <textarea
                            className={styles.fieldTextarea}
                            value={day.babyDevelopmentItems.join("\n")}
                            onChange={(event) =>
                              onWeekDayChange(
                                index,
                                "babyDevelopmentItems",
                                event.target.value
                                  .split("\n")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              )
                            }
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>아기의 말</span>
                          <textarea
                            className={styles.fieldTextarea}
                            value={day.babyMessage ?? ""}
                            onChange={(event) =>
                              onWeekDayChange(
                                index,
                                "babyMessage",
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>산모 변화 항목</span>
                          <textarea
                            className={styles.fieldTextarea}
                            value={day.motherChangesItems.join("\n")}
                            onChange={(event) =>
                              onWeekDayChange(
                                index,
                                "motherChangesItems",
                                event.target.value
                                  .split("\n")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              )
                            }
                          />
                        </label>
                      </div>

                      <div
                        className={`${styles.listMetaGroup} ${styles.editorMetaGroup}`}
                      >
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>순서</span>
                          <input
                            className={styles.fieldInput}
                            inputMode="numeric"
                            value={day.displayOrder}
                            onChange={(event) =>
                              onWeekDayChange(
                                index,
                                "displayOrder",
                                Number(event.target.value) || day.dayNumber,
                              )
                            }
                          />
                        </label>
                        <div className={styles.rowActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={index === 0}
                            onClick={() => onMoveWeekDay(index, -1)}
                            aria-label="Day 위로"
                          >
                            위로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={index === selectedWeekDetail.days.length - 1}
                            onClick={() => onMoveWeekDay(index, 1)}
                            aria-label="Day 아래로"
                          >
                            아래로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => onRemoveWeekDay(index)}
                            aria-label="Day 삭제"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.panelTitle}>체크리스트</h3>
                    <p className={styles.panelDescription}>
                      주차별로 여러 개의 체크리스트 항목을 정의합니다.
                    </p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={onAddWeekSection}
                    aria-label="체크리스트 추가"
                  >
                    체크리스트 추가
                  </button>
                </div>

                <div className={styles.list}>
                  {selectedWeekDetail.sections.map((section, index) => (
                    <div
                      key={section.id || `new-section-${index}`}
                      className={`${styles.listRow} ${styles.editorListRow}`}
                    >
                      <div className={styles.listDetail}>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Day 번호</span>
                          <input
                            className={styles.fieldInput}
                            inputMode="numeric"
                            value={section.dayNumber ?? ""}
                            onChange={(event) =>
                              onWeekSectionChange(
                                index,
                                "dayNumber",
                                event.target.value
                                  ? Number(event.target.value) || 1
                                  : null,
                              )
                            }
                          />
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>체크리스트 코드</span>
                          <input
                            className={styles.fieldInput}
                            value={section.sectionKey}
                            onChange={(event) =>
                              onWeekSectionChange(
                                index,
                                "sectionKey",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>체크리스트 제목</span>
                          <input
                            className={styles.fieldInput}
                            value={section.title}
                            onChange={(event) =>
                              onWeekSectionChange(
                                index,
                                "title",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>설명</span>
                          <textarea
                            className={styles.fieldTextarea}
                            value={section.body}
                            onChange={(event) =>
                              onWeekSectionChange(
                                index,
                                "body",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      </div>
                      <div
                        className={`${styles.listMetaGroup} ${styles.editorMetaGroup}`}
                      >
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>순서</span>
                          <input
                            className={styles.fieldInput}
                            inputMode="numeric"
                            value={section.displayOrder}
                            onChange={(event) =>
                              onWeekSectionChange(
                                index,
                                "displayOrder",
                                Number(event.target.value) || 0,
                              )
                            }
                          />
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>필수 여부</span>
                          <select
                            className={styles.fieldSelect}
                            value={section.isRequired ? "required" : "optional"}
                            onChange={(event) =>
                              onWeekSectionChange(
                                index,
                                "isRequired",
                                event.target.value === "required",
                              )
                            }
                          >
                            <option value="optional">optional</option>
                            <option value="required">required</option>
                          </select>
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>활성 여부</span>
                          <select
                            className={styles.fieldSelect}
                            value={section.isActive ? "active" : "inactive"}
                            onChange={(event) =>
                              onWeekSectionChange(
                                index,
                                "isActive",
                                event.target.value === "active",
                              )
                            }
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        </label>
                        <div className={styles.rowActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={index === 0}
                            onClick={() => onMoveWeekSection(index, -1)}
                            aria-label="체크리스트 위로"
                          >
                            위로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={index === selectedWeekDetail.sections.length - 1}
                            onClick={() => onMoveWeekSection(index, 1)}
                            aria-label="체크리스트 아래로"
                          >
                            아래로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => onRemoveWeekSection(index)}
                            aria-label="체크리스트 삭제"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.panelTitle}>질문</h3>
                    <p className={styles.panelDescription}>
                      주차별 질문 정의와 답변 유도 문구를 관리합니다.
                    </p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={onAddWeekAsset}
                    aria-label="질문 추가"
                  >
                    질문 추가
                  </button>
                </div>

                <div className={styles.list}>
                  {selectedWeekDetail.assets.map((asset, index) => (
                    <div
                      key={asset.id || `new-asset-${index}`}
                      className={`${styles.listRow} ${styles.editorListRow}`}
                    >
                      <div className={styles.listDetail}>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Day 번호</span>
                          <input
                            className={styles.fieldInput}
                            inputMode="numeric"
                            value={asset.dayNumber ?? ""}
                            onChange={(event) =>
                              onWeekAssetChange(
                                index,
                                "dayNumber",
                                event.target.value
                                  ? Number(event.target.value) || 1
                                  : null,
                              )
                            }
                          />
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>질문 타입</span>
                          <input
                            className={styles.fieldInput}
                            value={asset.assetType}
                            onChange={(event) =>
                              onWeekAssetChange(
                                index,
                                "assetType",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>질문 문구</span>
                          <input
                            className={styles.fieldInput}
                            value={asset.storagePath}
                            onChange={(event) =>
                              onWeekAssetChange(
                                index,
                                "storagePath",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      </div>
                      <div
                        className={`${styles.listMetaGroup} ${styles.editorMetaGroup}`}
                      >
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>도움말</span>
                          <input
                            className={styles.fieldInput}
                            value={asset.altText ?? ""}
                            onChange={(event) =>
                              onWeekAssetChange(
                                index,
                                "altText",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>질문 코드</span>
                          <input
                            className={styles.fieldInput}
                            value={asset.styleKey ?? ""}
                            onChange={(event) =>
                              onWeekAssetChange(
                                index,
                                "styleKey",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>필수 여부</span>
                          <select
                            className={styles.fieldSelect}
                            value={asset.isRequired ? "required" : "optional"}
                            onChange={(event) =>
                              onWeekAssetChange(
                                index,
                                "isRequired",
                                event.target.value === "required",
                              )
                            }
                          >
                            <option value="optional">optional</option>
                            <option value="required">required</option>
                          </select>
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>활성 여부</span>
                          <select
                            className={styles.fieldSelect}
                            value={asset.isActive ? "active" : "inactive"}
                            onChange={(event) =>
                              onWeekAssetChange(
                                index,
                                "isActive",
                                event.target.value === "active",
                              )
                            }
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        </label>
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>순서</span>
                          <input
                            className={styles.fieldInput}
                            inputMode="numeric"
                            value={asset.displayOrder}
                            onChange={(event) =>
                              onWeekAssetChange(
                                index,
                                "displayOrder",
                                Number(event.target.value) || 0,
                              )
                            }
                          />
                        </label>
                        <div className={styles.rowActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={index === 0}
                            onClick={() => onMoveWeekAsset(index, -1)}
                            aria-label="질문 위로"
                          >
                            위로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={index === selectedWeekDetail.assets.length - 1}
                            onClick={() => onMoveWeekAsset(index, 1)}
                            aria-label="질문 아래로"
                          >
                            아래로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => onRemoveWeekAsset(index)}
                            aria-label="질문 삭제"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.panelTitle}>이미지 매핑</h3>
                    <p className={styles.panelDescription}>
                      Storage bucket/object path 기준으로 주차 또는 day 이미지를 연결합니다.
                    </p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={onAddWeekMedia}
                    aria-label="이미지 매핑 추가"
                  >
                    이미지 추가
                  </button>
                </div>

                <div className={styles.list}>
                  {selectedWeekDetail.media.map((media, index) => (
                    <div
                      key={media.id || `new-media-${index}`}
                      className={`${styles.listRow} ${styles.editorListRow}`}
                    >
                      <div className={styles.listDetail}>
                        <div className={styles.panelGrid}>
                          <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Scope</span>
                            <select
                              className={styles.fieldSelect}
                              value={media.mediaScope}
                              onChange={(event) =>
                                onWeekMediaChange(
                                  index,
                                  "mediaScope",
                                  event.target.value,
                                )
                              }
                            >
                              <option value="week">week</option>
                              <option value="day">day</option>
                            </select>
                          </label>
                          <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Day 번호</span>
                            <input
                              className={styles.fieldInput}
                              inputMode="numeric"
                              value={media.dayNumber ?? ""}
                              onChange={(event) =>
                                onWeekMediaChange(
                                  index,
                                  "dayNumber",
                                  event.target.value
                                    ? Number(event.target.value) || 1
                                    : null,
                                )
                              }
                            />
                          </label>
                        </div>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Bucket ID</span>
                          <input
                            className={styles.fieldInput}
                            value={media.bucketId}
                            onChange={(event) =>
                              onWeekMediaChange(
                                index,
                                "bucketId",
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Object Path</span>
                          <input
                            className={styles.fieldInput}
                            value={media.objectPath}
                            onChange={(event) =>
                              onWeekMediaChange(
                                index,
                                "objectPath",
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>이미지 업로드</span>
                          <input
                            className={styles.fieldInput}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                return;
                              }

                              void onUploadWeekMedia(index, file);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>

                        <div className={styles.panelGrid}>
                          <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Media Role</span>
                            <input
                              className={styles.fieldInput}
                              value={media.mediaRole}
                              onChange={(event) =>
                                onWeekMediaChange(
                                  index,
                                  "mediaRole",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <label className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>원본 파일명</span>
                            <input
                              className={styles.fieldInput}
                              value={media.sourceFileName ?? ""}
                              onChange={(event) =>
                                onWeekMediaChange(
                                  index,
                                  "sourceFileName",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                        </div>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>대체 텍스트</span>
                          <input
                            className={styles.fieldInput}
                            value={media.altText ?? ""}
                            onChange={(event) =>
                              onWeekMediaChange(
                                index,
                                "altText",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      </div>

                      <div
                        className={`${styles.listMetaGroup} ${styles.editorMetaGroup}`}
                      >
                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>순서</span>
                          <input
                            className={styles.fieldInput}
                            inputMode="numeric"
                            value={media.displayOrder}
                            onChange={(event) =>
                              onWeekMediaChange(
                                index,
                                "displayOrder",
                                Number(event.target.value) || 0,
                              )
                            }
                          />
                        </label>
                        {uploadingMediaIndex === index ? (
                          <p className={styles.formHint}>
                            이미지를 업로드하는 중입니다.
                          </p>
                        ) : null}
                        <div className={styles.rowActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={index === 0}
                            onClick={() => onMoveWeekMedia(index, -1)}
                            aria-label="이미지 위로"
                          >
                            위로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={index === selectedWeekDetail.media.length - 1}
                            onClick={() => onMoveWeekMedia(index, 1)}
                            aria-label="이미지 아래로"
                          >
                            아래로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => onRemoveWeekMedia(index)}
                            aria-label="이미지 삭제"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.listEmpty}>
                {isLoadingWeeks
                  ? "주차 상세를 불러오는 중입니다."
                  : "테이블에서 주차를 선택하면 편집 패널이 열립니다."}
              </div>
            )}
          </div>
          <div className={styles.overlayFooter}>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={isWeekSaving || isLoadingWeeks || !selectedWeekDetail}
              onClick={onSaveWeek}
            >
              주차 저장
            </button>
          </div>
        </aside>
      </>
    );
  }

  function renderWeekImageField(input: {
    field: "heroImagePath" | "compareImagePath";
    label: string;
    value: string | null;
  }) {
    const fallbackStoragePath =
      !input.value && selectedWeekReferenceMedia
        ? `storage://${selectedWeekReferenceMedia.bucketId}/${selectedWeekReferenceMedia.objectPath}`
        : null;
    const previewSrc = resolveImagePreviewSrc(input.value ?? fallbackStoragePath);
    const isUploading = uploadingCoverField === input.field;

    return (
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>{input.label}</span>
        <div className={styles.imageFieldCard}>
          <WeekImagePreview src={previewSrc} alt={input.label} />

          <div className={styles.imageFieldActions}>
            <label className={styles.secondaryButton}>
              {isUploading ? "업로드 중" : "이미지 업로드"}
              <input
                className={styles.fileInput}
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onUploadWeekCoverImage(input.field, file);
                  }
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!input.value}
              onClick={() => onWeekFieldChange(input.field, "")}
            >
              이미지 제거
            </button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
