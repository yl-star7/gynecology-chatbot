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

import {
  getDocumentStatusBadge,
  getDocumentStatusLabel,
  getWeekStatusBadge,
  getWeekStatusLabel,
  getWorkflowStatusBadge,
  getWorkflowStatusLabel,
} from "./admin-dashboard-labels";
import styles from "./AdminConsoleLayout.module.css";

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
  uploadingMediaIndex: number | null;
  isRagSubmitting: boolean;
  isKnowledgeSaving: boolean;
  isWorkflowSaving: boolean;
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
  uploadingMediaIndex,
  isRagSubmitting,
  isKnowledgeSaving,
  isWorkflowSaving,
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
  onSelectWeek,
  onWeekFieldChange,
  onWeekStatusChange,
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
  const readyDocuments = ragDocuments.filter((document) => document.status === "ready").length;
  const draftDocuments = ragDocuments.filter((document) => document.status === "draft").length;
  const showStatic = view === "all" || view === "static";
  const showDocuments = view === "all" || view === "documents";
  const showWeeks = view === "all" || view === "weeks";
  const showPolicies = view === "all" || view === "policies";

  return (
    <section className={styles.panelGrid}>
      {showStatic ? (
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>정적 문헌 관리</h2>
          </div>
        </div>

        <div className={styles.panelGrid}>
          <div className={styles.list}>
            {knowledgeItems.map((item) => (
              <button
                key={item.id}
                className={styles.listButton}
                type="button"
                onClick={() => onSelectKnowledgeItem(item.id)}
              >
                <div className={styles.listDetail}>
                  <strong className={styles.listPrimary}>{item.title}</strong>
                  <span className={styles.listMeta}>
                    {item.section} · {item.slug}
                  </span>
                </div>
                <div className={styles.listMetaGroup}>
                  <span
                    className={`${styles.statusBadge} ${styles[getWeekStatusBadge(item.status)] ?? ""}`}
                  >
                    {getWeekStatusLabel(item.status)}
                  </span>
                  <span className={styles.listMeta}>
                    {selectedKnowledgeItemId === item.id ? "선택됨" : item.updatedAt}
                  </span>
                </div>
              </button>
            ))}
            {knowledgeItems.length === 0 ? (
              <div className={styles.listEmpty}>
                등록된 정적 문헌이 아직 없습니다.
              </div>
            ) : null}
          </div>

          <div className={styles.formGrid}>
            {contentMessage ? (
              <p className={styles.formHint}>{contentMessage}</p>
            ) : null}

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
                className={styles.fieldTextarea}
                value={knowledgeBody}
                onChange={(event) => onKnowledgeBodyChange(event.target.value)}
              />
            </label>

            <div className={styles.actionRow}>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={isKnowledgeSaving}
                onClick={onCreateKnowledgeItem}
              >
                문헌 생성
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isKnowledgeSaving || !selectedKnowledgeItemId}
                onClick={onUpdateKnowledgeItem}
              >
                문헌 수정
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isKnowledgeSaving || !selectedKnowledgeItemId}
                onClick={onDeleteKnowledgeItem}
              >
                문헌 삭제
              </button>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {showDocuments ? (
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>지식 문서 관리</h2>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.panelStat}>
            <span className={styles.metaLabel}>전체 문서</span>
            <strong>{ragDocuments.length}</strong>
          </div>
          <div className={styles.panelStat}>
            <span className={styles.metaLabel}>배포 가능</span>
            <strong>{readyDocuments}</strong>
          </div>
          <div className={styles.panelStat}>
            <span className={styles.metaLabel}>작성 중</span>
            <strong>{draftDocuments}</strong>
          </div>
          <div className={styles.panelStat}>
            <span className={styles.metaLabel}>최근 업데이트</span>
            <strong>{ragDocuments[0]?.updatedAt ?? "-"}</strong>
          </div>
        </div>

        <div className={styles.formGrid}>
          {contentMessage ? (
            <p className={styles.formHint}>{contentMessage}</p>
          ) : null}

          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>문서 제목</span>
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
            <span className={styles.fieldLabel}>문서 내용</span>
            <textarea
              className={styles.fieldTextarea}
              value={ragContent}
              onChange={(event) => onRagContentChange(event.target.value)}
            />
          </label>

          <div className={styles.actionRow}>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={isRagSubmitting}
              onClick={onResetRagDocument}
            >
              새 문서
            </button>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={isRagSubmitting}
              onClick={onUploadRagDocument}
            >
              {selectedRagDocumentId ? "문서 저장" : "문서 반영"}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={isRagSubmitting || !selectedRagDocumentId}
              onClick={onDeleteRagDocument}
            >
              문서 삭제
            </button>
          </div>
        </div>

        <div className={styles.list}>
          {ragDocuments.map((document) => (
            <button
              key={document.id}
              className={styles.listButton}
              type="button"
              onClick={() => void onSelectRagDocument(document.id)}
            >
              <div className={styles.listDetail}>
                <strong className={styles.listPrimary}>{document.title}</strong>
                <span className={styles.listMeta}>
                  {document.pregnancyWeekLabel} · {document.category}
                </span>
              </div>
              <div className={styles.listMetaGroup}>
                <span
                  className={`${styles.statusBadge} ${styles[getDocumentStatusBadge(document.status)] ?? ""}`}
                >
                  {getDocumentStatusLabel(document.status)}
                </span>
                <span className={styles.listMeta}>
                  {document.chunkCount}개 청크 · {selectedRagDocumentId === document.id ? "선택됨" : document.updatedAt}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
      ) : null}

      {showWeeks ? (
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>주차별 데이터 관리</h2>
          </div>
        </div>

        <div className={styles.panelGrid}>
          <div className={styles.list}>
            {weekSummaries.map((week) => (
              <button
                key={week.id}
                className={styles.listButton}
                type="button"
                onClick={() => onSelectWeek(week.weekNumber)}
              >
                <div className={styles.listDetail}>
                  <strong className={styles.listPrimary}>
                    {week.weekNumber}주차
                  </strong>
                  <span className={styles.listMeta}>{week.title}</span>
                </div>
                <div className={styles.listMetaGroup}>
                  <span
                    className={`${styles.statusBadge} ${styles[getWeekStatusBadge(week.status)] ?? ""}`}
                  >
                    {getWeekStatusLabel(week.status)}
                  </span>
                  <span className={styles.listMeta}>
                    {selectedWeekNumber === week.weekNumber ? "선택됨" : week.updatedAt}
                  </span>
                </div>
              </button>
            ))}
            {weekSummaries.length === 0 ? (
              <div className={styles.listEmpty}>
                {isLoadingWeeks
                  ? "주차 목록을 불러오는 중입니다."
                  : "관리 가능한 주차 데이터가 아직 없습니다."}
              </div>
            ) : null}
          </div>

          <div className={styles.formGrid}>
            {selectedWeekDetail ? (
              <>
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
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>경고 신호</span>
                    <input
                      className={styles.fieldInput}
                      value={selectedWeekDetail.heroImagePath ?? ""}
                      onChange={(event) =>
                        onWeekFieldChange("heroImagePath", event.target.value)
                      }
                    />
                  </label>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>권장 액션</span>
                    <input
                      className={styles.fieldInput}
                      value={selectedWeekDetail.compareImagePath ?? ""}
                      onChange={(event) =>
                        onWeekFieldChange("compareImagePath", event.target.value)
                      }
                    />
                  </label>
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
                      className={styles.listRow}
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

                      <div className={styles.listMetaGroup}>
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
                      className={styles.listRow}
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
                      <div className={styles.listMetaGroup}>
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
                            disabled={
                              index === selectedWeekDetail.sections.length - 1
                            }
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
                      className={styles.listRow}
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
                      <div className={styles.listMetaGroup}>
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
                            disabled={
                              index === selectedWeekDetail.assets.length - 1
                            }
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
                      className={styles.listRow}
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
                              onWeekMediaChange(index, "bucketId", event.target.value)
                            }
                          />
                        </label>

                        <label className={styles.fieldGroup}>
                          <span className={styles.fieldLabel}>Object Path</span>
                          <input
                            className={styles.fieldInput}
                            value={media.objectPath}
                            onChange={(event) =>
                              onWeekMediaChange(index, "objectPath", event.target.value)
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
                                onWeekMediaChange(index, "mediaRole", event.target.value)
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
                              onWeekMediaChange(index, "altText", event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <div className={styles.listMetaGroup}>
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
                          <p className={styles.formHint}>이미지를 업로드하는 중입니다.</p>
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

                <div className={styles.actionRow}>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    disabled={isWeekSaving || isLoadingWeeks}
                    onClick={onSaveWeek}
                  >
                    주차 저장
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.listEmpty}>
                {isLoadingWeeks
                  ? "주차 상세를 불러오는 중입니다."
                  : "왼쪽에서 주차를 선택하면 편집기가 열립니다."}
              </div>
            )}
          </div>
        </div>
      </section>
      ) : null}

      {showPolicies ? (
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>응답 정책</h2>
          </div>
        </div>

        <div className={styles.list}>
          {workflowRules.map((rule) => (
            <button
              key={rule.id}
              className={styles.listButton}
              type="button"
              onClick={() => onSelectWorkflowRule(rule.id)}
            >
              <div className={styles.listDetail}>
                <strong className={styles.listPrimary}>{rule.name}</strong>
                <span className={styles.listMeta}>{rule.trigger}</span>
              </div>
              <div className={styles.listMetaGroup}>
                <span
                  className={`${styles.statusBadge} ${styles[getWorkflowStatusBadge(rule.status)] ?? ""}`}
                >
                  {getWorkflowStatusLabel(rule.status)}
                </span>
                <span className={styles.listMeta}>
                  {selectedWorkflowRuleId === rule.id ? "선택됨" : `${rule.retrievalScope} · ${rule.modelName}`}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className={styles.formGrid}>
          <div className={styles.panelGrid}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>정책 이름</span>
              <input
                className={styles.fieldInput}
                value={workflowName}
                onChange={(event) => onWorkflowNameChange(event.target.value)}
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

          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>트리거</span>
            <input
              className={styles.fieldInput}
              value={workflowTrigger}
              onChange={(event) => onWorkflowTriggerChange(event.target.value)}
            />
          </label>

          <div className={styles.panelGrid}>
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
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>모델</span>
              <input
                className={styles.fieldInput}
                value={workflowModelName}
                onChange={(event) =>
                  onWorkflowModelNameChange(event.target.value)
                }
              />
            </label>
          </div>

          <div className={styles.actionRow}>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={isWorkflowSaving || !selectedWorkflowRuleId}
              onClick={onSaveWorkflowRule}
            >
              정책 저장
            </button>
          </div>
        </div>
      </section>
      ) : null}
    </section>
  );
}
