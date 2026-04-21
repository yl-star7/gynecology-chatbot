"use client";

import type {
  AdminWeekAsset,
  AdminWeekDay,
  AdminWeekDetail,
  AdminWeekMedia,
  AdminWeekSection,
} from "@gynecology-chatbot/app-core";

import styles from "../AdminConsoleLayout.module.css";
import { WeekImagePreview } from "./WeekImagePreview";

export interface AdminWeekOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeekDetail: AdminWeekDetail | null;
  contentMessage: string | null;
  isWeekSaving: boolean;
  isLoadingWeeks: boolean;
  uploadingCoverField: "heroImagePath" | "compareImagePath" | null;
  uploadingMediaIndex: number | null;
  selectedWeekHeroMedia: AdminWeekMedia | undefined;
  selectedWeekCompareMedia: AdminWeekMedia | undefined;
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
  onPublishWeek: () => Promise<void>;
}

export function AdminWeekOverlay({
  isOpen,
  onClose,
  selectedWeekDetail,
  contentMessage,
  isWeekSaving,
  isLoadingWeeks,
  uploadingCoverField,
  uploadingMediaIndex,
  selectedWeekHeroMedia,
  selectedWeekCompareMedia,
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
  onPublishWeek,
}: AdminWeekOverlayProps) {
  const publicStorageBaseUrl = (
    process.env.NEXT_PUBLIC_GCS_PUBLIC_BASE_URL ??
    "https://storage.googleapis.com"
  ).replace(/\/$/, "");

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

  function renderWeekImageField(input: {
    field: "heroImagePath" | "compareImagePath";
    label: string;
    value: string | null;
    fallbackMedia: AdminWeekMedia | undefined;
  }) {
    const fallbackStoragePath =
      !input.value && input.fallbackMedia
        ? `storage://${input.fallbackMedia.bucketId}/${input.fallbackMedia.objectPath}`
        : null;
    const previewSrc = resolveImagePreviewSrc(
      input.value ?? fallbackStoragePath,
    );
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

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        aria-label="패널 닫기"
        className={styles.overlayBackdrop}
        type="button"
        onClick={onClose}
      />
      <aside className={`${styles.overlayPanel} ${styles.overlayPanelWide}`}>
        <div className={styles.overlayHeader}>
          <div>
            <h3 className={styles.panelTitle}>
              {selectedWeekDetail
                ? `${selectedWeekDetail.weekNumber}주차 편집`
                : "주차 편집"}
            </h3>
          </div>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
        <div className={styles.overlayBody}>
          {contentMessage ? (
            <p className={styles.formHint}>{contentMessage}</p>
          ) : null}
          {selectedWeekDetail ? (
            <>
              <div className={styles.detailGrid}>
                <div className={styles.panelStat}>
                  <span className={styles.metaLabel}>선택 주차</span>
                  <strong>{selectedWeekDetail.weekNumber}주차</strong>
                </div>
                <div className={styles.panelStat}>
                  <span className={styles.metaLabel}>상태</span>
                  <select
                    className={styles.fieldSelect}
                    value={selectedWeekDetail.status}
                    onChange={(event) =>
                      onWeekStatusChange(
                        event.target.value as AdminWeekDetail["status"],
                      )
                    }
                    style={{ marginTop: 4, fontWeight: 600 }}
                  >
                    <option value="draft">초안</option>
                    {selectedWeekDetail.status === "published" ? (
                      <option value="published">게시됨</option>
                    ) : null}
                    <option value="archived">보관됨</option>
                  </select>
                  <small style={{ color: "var(--admin-text-soft)" }}>
                    상태를 변경한 뒤 저장 버튼을 눌러주세요.
                  </small>
                </div>
                <div className={styles.panelStat}>
                  <span className={styles.metaLabel}>Day 수</span>
                  <strong>{selectedWeekDetail.days.length}</strong>
                </div>
                <div className={styles.panelStat}>
                  <span className={styles.metaLabel}>최근 수정</span>
                  <strong>
	                    {(() => {
	                      const d = new Date(selectedWeekDetail.updatedAt);
	                      return d.toLocaleDateString("ko-KR", {
	                        month: "long",
	                        day: "numeric",
	                        timeZone: "Asia/Seoul",
	                      });
	                    })()}
                  </strong>
                  <small style={{ color: "var(--admin-text-soft)" }}>
	                    {(() => {
	                      const d = new Date(selectedWeekDetail.updatedAt);
	                      return d.toLocaleTimeString("ko-KR", {
	                        hour: "2-digit",
	                        minute: "2-digit",
	                        timeZone: "Asia/Seoul",
	                      });
	                    })()}
                  </small>
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
                  <span className={styles.fieldLabel}>아기 크기</span>
                  <input
                    className={styles.fieldInput}
                    value={selectedWeekDetail.babySizeLabel ?? ""}
                    onChange={(event) => {
                      onWeekFieldChange("babySizeLabel", event.target.value);
                      onWeekFieldChange(
                        "babySizeCompareObject",
                        event.target.value,
                      );
                    }}
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

              {renderWeekImageField({
                field: "heroImagePath",
                label: "주차 대표 이미지",
                value: selectedWeekDetail.heroImagePath,
                fallbackMedia: selectedWeekHeroMedia,
              })}

              {renderWeekImageField({
                field: "compareImagePath",
                label: "크기 비교 이미지",
                value: selectedWeekDetail.compareImagePath,
                fallbackMedia: selectedWeekCompareMedia,
              })}

              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>Day별 본문</h3>
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
                      <h4 style={{ margin: 0 }}>Day {day.dayNumber}</h4>

                      <label className={styles.fieldGroup}>
                        <span className={styles.fieldLabel}>
                          아기 발달 항목
                        </span>
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
                        <span className={styles.fieldLabel}>
                          산모 변화 항목
                        </span>
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

                      {(() => {
                        const daySections = selectedWeekDetail.sections
                          .map((section, sectionIndex) => ({
                            section,
                            sectionIndex,
                          }))
                          .filter(
                            ({ section }) =>
                              section.dayNumber === day.dayNumber,
                          );
                        if (daySections.length === 0) return null;
                        return (
                          <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>
                              체크리스트
                            </span>
                            {daySections.map(({ section, sectionIndex }, i) => (
                              <input
                                key={section.id || `section-${sectionIndex}`}
                                className={styles.fieldInput}
                                placeholder={`항목 ${i + 1}`}
                                value={section.title}
                                onChange={(event) =>
                                  onWeekSectionChange(
                                    sectionIndex,
                                    "title",
                                    event.target.value,
                                  )
                                }
                              />
                            ))}
                          </div>
                        );
                      })()}

                      {(() => {
                        const dayAssets = selectedWeekDetail.assets
                          .map((asset, assetIndex) => ({ asset, assetIndex }))
                          .filter(
                            ({ asset }) => asset.dayNumber === day.dayNumber,
                          );
                        if (dayAssets.length === 0) return null;
                        return (
                          <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>태교 질문</span>
                            {dayAssets.map(({ asset, assetIndex }, i) => (
                              <input
                                key={asset.id || `asset-${assetIndex}`}
                                className={styles.fieldInput}
                                placeholder={`질문 ${i + 1}`}
                                value={asset.storagePath}
                                onChange={(event) =>
                                  onWeekAssetChange(
                                    assetIndex,
                                    "storagePath",
                                    event.target.value,
                                  )
                                }
                              />
                            ))}
                          </div>
                        );
                      })()}
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
                        <span className={styles.fieldLabel}>
                          체크리스트 코드
                        </span>
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
                        <span className={styles.fieldLabel}>
                          체크리스트 제목
                        </span>
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
                    Storage bucket/object path 기준으로 주차 또는 day 이미지를
                    연결합니다.
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
                          disabled={
                            index === selectedWeekDetail.media.length - 1
                          }
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
            onClick={async () => {
              await onSaveWeek();
              onClose();
            }}
          >
            저장
          </button>
        </div>
      </aside>
    </>
  );
}
