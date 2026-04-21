"use client";

import { useRef, useState } from "react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import {
  formatFileSize,
  getDocumentStatusBadge,
  getDocumentStatusLabel,
  getRagFileStatusBadge,
  getRagFileStatusLabel,
} from "../admin-dashboard-labels";
import styles from "../AdminConsoleLayout.module.css";

export type RagFileItem = {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: "processing" | "ready" | "failed";
  enabled: boolean;
  errorMessage: string | null;
  createdAt: string;
};

export interface AdminDocumentsSectionProps {
  ragDocuments: AdminDashboardData["ragDocuments"];
  ragFiles: RagFileItem[];
  selectedRagDocumentId: string;
  contentMessage: string | null;
  ragTitle: string;
  ragCategory: string;
  ragWeek: string;
  ragContent: string;
  isRagSubmitting: boolean;
  isFileUploading: boolean;
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
}

export function AdminDocumentsSection({
  ragDocuments,
  ragFiles,
  selectedRagDocumentId,
  contentMessage,
  ragTitle,
  ragCategory,
  ragWeek,
  ragContent,
  isRagSubmitting,
  isFileUploading,
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
}: AdminDocumentsSectionProps) {
  const [activeOverlay, setActiveOverlay] = useState(false);
  const [documentQuery, setDocumentQuery] = useState("");
  const [documentStatusFilter, setDocumentStatusFilter] = useState("all");
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [togglingFileId, setTogglingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRagDocument =
    ragDocuments.find((document) => document.id === selectedRagDocumentId) ??
    null;

  const filteredRagDocuments = ragDocuments.filter((document) => {
    const query = documentQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      document.title.toLowerCase().includes(query) ||
      document.category.toLowerCase().includes(query);
    const matchesStatus =
      documentStatusFilter === "all" ||
      document.status === documentStatusFilter;
    return matchesQuery && matchesStatus;
  });

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await onUploadRagFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleDeleteFile(fileId: string) {
    setDeletingFileId(fileId);
    try {
      await onDeleteRagFile(fileId);
    } finally {
      setDeletingFileId(null);
    }
  }

  return (
    <section className={styles.sectionStack}>
      {/* 파일 업로드 섹션 */}
      <section className={styles.panel}>
        <div className={styles.routeHeader}>
          <div>
            <h2 className={styles.routeTitle}>파일 자료</h2>
            <p className={styles.panelDescription}>
              PDF, DOCX, TXT 파일을 업로드하면 자동으로 분석되어 검색에
              반영됩니다.
            </p>
          </div>
          <div className={styles.topbarActions}>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={isFileUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isFileUploading ? "업로드 중..." : "파일 업로드"}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        <div className={styles.dataTable}>
          <div className={styles.dataTableHeader}>
            <span>파일명</span>
            <span>상태</span>
            <span>반영</span>
            <span>크기</span>
            <span>업로드일</span>
            <span />
          </div>
          {ragFiles.map((file) => (
            <div key={file.id} className={styles.dataTableRow}>
              <span className={styles.dataTableTitleGroup}>
                <strong>{file.filename}</strong>
              </span>
              <span>
                <span
                  className={`${styles.statusBadge} ${
                    styles[getRagFileStatusBadge(file.status)] ?? ""
                  }`}
                  title={file.errorMessage ?? undefined}
                >
                  {getRagFileStatusLabel(file.status)}
                </span>
              </span>
              <span>
                <button
                  className={
                    file.enabled ? styles.primaryButton : styles.secondaryButton
                  }
                  type="button"
                  disabled={
                    file.status !== "ready" || togglingFileId === file.id
                  }
                  onClick={async () => {
                    setTogglingFileId(file.id);
                    try {
                      await onToggleRagFile(file.id, !file.enabled);
                    } finally {
                      setTogglingFileId(null);
                    }
                  }}
                >
                  {file.enabled ? "반영 중" : "미반영"}
                </button>
              </span>
              <span>{formatFileSize(file.fileSize)}</span>
              <span>
	                {new Date(file.createdAt).toLocaleDateString("ko-KR", {
	                  timeZone: "Asia/Seoul",
	                })}
              </span>
              <span>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={deletingFileId === file.id}
                  onClick={() => void handleDeleteFile(file.id)}
                >
                  삭제
                </button>
              </span>
            </div>
          ))}
          {ragFiles.length === 0 ? (
            <div className={styles.listEmpty}>업로드된 파일이 없습니다.</div>
          ) : null}
        </div>
      </section>

      {/* 기존 텍스트 문서 섹션 */}
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
                setActiveOverlay(true);
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
                setActiveOverlay(true);
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

      {activeOverlay ? (
        <>
          <button
            aria-label="패널 닫기"
            className={styles.overlayBackdrop}
            type="button"
            onClick={() => setActiveOverlay(false)}
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
                onClick={() => setActiveOverlay(false)}
              >
                닫기
              </button>
            </div>
            <div className={styles.overlayBody}>
              {contentMessage ? (
                <p className={styles.formHint}>{contentMessage}</p>
              ) : null}
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
                    onChange={(event) =>
                      onRagCategoryChange(event.target.value)
                    }
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
