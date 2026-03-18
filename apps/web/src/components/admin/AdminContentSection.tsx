"use client";

import type {
  AdminDashboardData,
  AdminKnowledgeItem,
  AdminWeekAsset,
  AdminWeekDetail,
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
  onWeekSectionChange: (
    index: number,
    field: keyof AdminWeekSection,
    value: string | number | boolean,
  ) => void;
  onWeekAssetChange: (
    index: number,
    field: keyof AdminWeekAsset,
    value: string | number | null,
  ) => void;
  onAddWeekSection: () => void;
  onAddWeekAsset: () => void;
  onMoveWeekSection: (index: number, direction: -1 | 1) => void;
  onMoveWeekAsset: (index: number, direction: -1 | 1) => void;
  onRemoveWeekSection: (index: number) => void;
  onRemoveWeekAsset: (index: number) => void;
  onSaveWeek: () => Promise<void>;
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
  onWeekSectionChange,
  onWeekAssetChange,
  onAddWeekSection,
  onAddWeekAsset,
  onMoveWeekSection,
  onMoveWeekAsset,
  onRemoveWeekSection,
  onRemoveWeekAsset,
  onSaveWeek,
}: AdminContentSectionProps) {
  const readyDocuments = ragDocuments.filter((document) => document.status === "ready").length;
  const draftDocuments = ragDocuments.filter((document) => document.status === "draft").length;

  return (
    <section className={styles.panelGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Knowledge Items</p>
            <h2 className={styles.panelTitle}>정적 문헌 관리</h2>
            <p className={styles.panelDescription}>
              `knowledge`와 `notebook` 섹션용 정적 문헌을 직접 생성, 수정, 삭제합니다.
            </p>
          </div>
          <span className={styles.statusBadge}>Docs</span>
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

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Knowledge Base</p>
            <h2 className={styles.panelTitle}>지식 문서 관리</h2>
            <p className={styles.panelDescription}>
              문서 추가와 상태 점검을 Carbon식 밀도와 표 구조로 정리합니다.
            </p>
          </div>
          <span className={`${styles.statusBadge} ${styles.tagActive}`}>Ready</span>
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

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Pregnancy Weeks</p>
            <h2 className={styles.panelTitle}>주차별 데이터 관리</h2>
            <p className={styles.panelDescription}>
              주차 기본 정보, 본문 섹션, 에셋 메타데이터를 같은 작업 맥락에서 편집합니다.
            </p>
          </div>
          <span className={`${styles.statusBadge} ${styles.tagAccent}`}>Weeks</span>
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
                    <span className={styles.fieldLabel}>Hero 이미지 경로</span>
                    <input
                      className={styles.fieldInput}
                      value={selectedWeekDetail.heroImagePath ?? ""}
                      onChange={(event) =>
                        onWeekFieldChange("heroImagePath", event.target.value)
                      }
                    />
                  </label>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Compare 이미지 경로</span>
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
                    <h3 className={styles.panelTitle}>본문 섹션</h3>
                    <p className={styles.panelDescription}>
                      섹션 키와 본문을 주차별로 정리합니다.
                    </p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={onAddWeekSection}
                  >
                    섹션 추가
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
                          <span className={styles.fieldLabel}>섹션 키</span>
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
                          <span className={styles.fieldLabel}>섹션 제목</span>
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
                          <span className={styles.fieldLabel}>본문</span>
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
                        <div className={styles.rowActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={index === 0}
                            onClick={() => onMoveWeekSection(index, -1)}
                          >
                            섹션 위로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={
                              index === selectedWeekDetail.sections.length - 1
                            }
                            onClick={() => onMoveWeekSection(index, 1)}
                          >
                            섹션 아래로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => onRemoveWeekSection(index)}
                          >
                            섹션 삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.panelTitle}>에셋 메타데이터</h3>
                    <p className={styles.panelDescription}>
                      저장 경로와 보조 텍스트를 주차 데이터와 함께 유지합니다.
                    </p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={onAddWeekAsset}
                  >
                    에셋 추가
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
                          <span className={styles.fieldLabel}>에셋 타입</span>
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
                          <span className={styles.fieldLabel}>저장 경로</span>
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
                          <span className={styles.fieldLabel}>대체 텍스트</span>
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
                          <span className={styles.fieldLabel}>스타일 키</span>
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
                          >
                            에셋 위로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={
                              index === selectedWeekDetail.assets.length - 1
                            }
                            onClick={() => onMoveWeekAsset(index, 1)}
                          >
                            에셋 아래로
                          </button>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => onRemoveWeekAsset(index)}
                          >
                            에셋 삭제
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

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Response Policies</p>
            <h2 className={styles.panelTitle}>응답 정책</h2>
            <p className={styles.panelDescription}>
              운영자가 현재 활성 라우팅 정책을 빠르게 감사할 수 있게 유지합니다.
            </p>
          </div>
          <span className={`${styles.statusBadge} ${styles.tagAccent}`}>Rules</span>
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
    </section>
  );
}
