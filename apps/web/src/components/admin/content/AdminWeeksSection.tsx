"use client";

import { useState } from "react";

import type {
  AdminWeekAsset,
  AdminWeekDay,
  AdminWeekDetail,
  AdminWeekMedia,
  AdminWeekSection,
  AdminWeekSummary,
} from "@gynecology-chatbot/app-core";

import {
  getWeekStatusBadge,
  getWeekStatusLabel,
} from "../admin-dashboard-labels";
import styles from "../AdminConsoleLayout.module.css";
import { AdminWeekOverlay } from "./AdminWeekOverlay";
import {
  getWeekPublishDayStatus,
  getWeekPublishReview,
} from "./week-publish-review";

export interface AdminWeeksSectionProps {
  weekSummaries: AdminWeekSummary[];
  selectedWeekNumber: number | null;
  selectedWeekDetail: AdminWeekDetail | null;
  isLoadingWeeks: boolean;
  isWeekSaving: boolean;
  contentMessage: string | null;
  uploadingCoverField: "heroImagePath" | "compareImagePath" | null;
  uploadingMediaIndex: number | null;
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
  onPublishWeek: () => Promise<void>;
}

export function AdminWeeksSection({
  weekSummaries,
  selectedWeekNumber,
  selectedWeekDetail,
  isLoadingWeeks,
  isWeekSaving,
  contentMessage,
  uploadingCoverField,
  uploadingMediaIndex,
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
  onPublishWeek,
}: AdminWeeksSectionProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [weekQuery, setWeekQuery] = useState("");
  const [weekStatusFilter, setWeekStatusFilter] = useState("all");

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
          const status = getWeekPublishDayStatus(
            selectedWeekDetail,
            day.dayNumber,
          );

          return {
            id: day.id || `day-${day.dayNumber}`,
            dayNumber: day.dayNumber,
            title: day.title?.trim() || `Day ${day.dayNumber}`,
            fetalCount: day.babyDevelopmentItems.filter((item) => item.trim())
              .length,
            maternalCount: day.motherChangesItems.filter((item) => item.trim())
              .length,
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

  const publishReview = selectedWeekDetail
    ? getWeekPublishReview(selectedWeekDetail)
    : null;
  const publishReviewMessage = publishReview
    ? publishReview.isReady
      ? "Day 1~7 검수를 마쳤어요. 지금 바로 게시할 수 있어요."
      : `게시 전 확인이 필요한 항목 ${publishReview.missingItems.length}개`
    : null;

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
                  </div>
                  <div className={styles.weekRegistryMeta}>
                    <small>최근수정일: {week.updatedAt.slice(0, 10)}</small>
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
              {contentMessage ? (
                <section className={styles.panel}>
                  <p className={styles.formHint}>{contentMessage}</p>
                </section>
              ) : null}
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.panelTitle}>
                      {selectedWeekDetail.weekNumber}주차 개요
                    </h3>
                  </div>
                  <div className={styles.topbarActions}>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      onClick={() => setIsOverlayOpen(true)}
                    >
                      상세 편집 열기
                    </button>
                  </div>
                </div>

                <div className={styles.weekHeroGrid}>
                  <div className={styles.weekBabyImageWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/week-baby/week-baby-w${String(selectedWeekDetail.weekNumber).padStart(2, "0")}.png`}
                      alt={`${selectedWeekDetail.weekNumber}주 아기 일러스트`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const parent = (e.target as HTMLImageElement)
                          .parentElement;
                        if (parent) {
                          const placeholder = document.createElement("span");
                          placeholder.className = styles.weekBabyPlaceholder;
                          placeholder.textContent = "이미지 없음";
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                  </div>
                  <div className={styles.weekHeroPrimary}>
                    <div className={styles.weekHeroHeading}>
                      <span className={styles.metaLabel}>선택 주차</span>
                      <h4>{selectedWeekDetail.title}</h4>
                    </div>
                    <div className={styles.badgeRow}>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[
                            getWeekStatusBadge(selectedWeekDetail.status)
                          ] ?? ""
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
                      <article className={styles.weekSummaryCard}>
                        <span className={styles.metaLabel}>게시 게이트</span>
                        <p>{publishReviewMessage}</p>
                        {!publishReview?.isReady && publishReview ? (
                          <small className={styles.panelDescription}>
                            {publishReview.missingItems.slice(0, 3).join(", ")}
                            {publishReview.missingItems.length > 3 ? " 외" : ""}
                          </small>
                        ) : null}
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
                      <strong>
                        {selectedWeekOverview?.checklistCount ?? 0}
                      </strong>
                    </div>
                    <div className={styles.panelStat}>
                      <span className={styles.metaLabel}>질문</span>
                      <strong>
                        {selectedWeekOverview?.questionCount ?? 0}
                      </strong>
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
                  </div>
                </div>

                <div className={styles.weekDayList}>
                  {selectedWeekDayRows.map((day) => (
                    <article key={day.id} className={styles.weekDayRow}>
                      <div className={styles.weekDayLead}>
                        <div>
                          <h4>Day {day.dayNumber}</h4>
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

      <AdminWeekOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        selectedWeekDetail={selectedWeekDetail}
        contentMessage={contentMessage}
        isWeekSaving={isWeekSaving}
        isLoadingWeeks={isLoadingWeeks}
        uploadingCoverField={uploadingCoverField}
        uploadingMediaIndex={uploadingMediaIndex}
        selectedWeekReferenceMedia={selectedWeekReferenceMedia}
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
        onPublishWeek={onPublishWeek}
      />
    </section>
  );
}
