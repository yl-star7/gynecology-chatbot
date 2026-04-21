"use client";

import { useState } from "react";

import type {
  AdminKnowledgeItem,
  HomeCopyItem,
  HomeCopySlot,
  HomeCopyStatus,
} from "@gynecology-chatbot/app-core";

import {
  getWeekStatusBadge,
  getWeekStatusLabel,
} from "../admin-dashboard-labels";
import styles from "../AdminConsoleLayout.module.css";
import { AdminHomeCopyPanel } from "./AdminHomeCopyPanel";

export interface AdminStaticSectionProps {
  homeCopyItems: HomeCopyItem[];
  selectedHomeCopyItemId: string;
  knowledgeItems: AdminKnowledgeItem[];
  selectedKnowledgeItemId: string;
  contentMessage: string | null;
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
  isHomeCopySaving: boolean;
  isKnowledgeSaving: boolean;
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
  onResetHomeCopyItem: () => void;
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
  onResetKnowledgeItem: () => void;
}

export function AdminStaticSection({
  homeCopyItems,
  selectedHomeCopyItemId,
  knowledgeItems,
  selectedKnowledgeItemId,
  contentMessage,
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
  isHomeCopySaving,
  isKnowledgeSaving,
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
  onResetHomeCopyItem,
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
  onResetKnowledgeItem,
}: AdminStaticSectionProps) {
  const [activeOverlay, setActiveOverlay] = useState(false);
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [knowledgeStatusFilter, setKnowledgeStatusFilter] = useState("all");

  const selectedKnowledgeItem =
    knowledgeItems.find((item) => item.id === selectedKnowledgeItemId) ?? null;

  const filteredKnowledgeItems = knowledgeItems.filter((item) => {
    const matchesQuery =
      !knowledgeQuery.trim() ||
      item.title.toLowerCase().includes(knowledgeQuery.trim().toLowerCase()) ||
      item.slug.toLowerCase().includes(knowledgeQuery.trim().toLowerCase());
    const matchesStatus =
      knowledgeStatusFilter === "all" || item.status === knowledgeStatusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <section className={styles.sectionStack}>
      <AdminHomeCopyPanel
        homeCopyItems={homeCopyItems}
        selectedHomeCopyItemId={selectedHomeCopyItemId}
        contentMessage={contentMessage}
        homeCopySlot={homeCopySlot}
        homeCopyVariant={homeCopyVariant}
        homeCopyTitle={homeCopyTitle}
        homeCopyBody={homeCopyBody}
        homeCopyStatus={homeCopyStatus}
        homeCopyDisplayOrder={homeCopyDisplayOrder}
        isHomeCopySaving={isHomeCopySaving}
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
      />

      <section className={styles.panel}>
        <div className={styles.routeHeader}>
          <div>
            <h2 className={styles.routeTitle}>주차별 아기는요?</h2>
            <p className={styles.panelDescription}>
              주차별 아기 정보에 함께 쓰는 고정 안내문을 관리하고, 상세 수정은
              우측 패널에서 처리합니다.
            </p>
          </div>
          <div className={styles.topbarActions}>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => {
                onResetKnowledgeItem();
                setActiveOverlay(true);
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
                setActiveOverlay(true);
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
            <div className={styles.listEmpty}>
              조건에 맞는 안내문이 없습니다.
            </div>
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
                  {selectedKnowledgeItem ? "안내문 편집" : "새 안내문"}
                </h3>
                <p className={styles.panelDescription}>
                  이름, 상태, 본문을 한 패널 안에서 수정합니다.
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
              <div className={styles.panelGrid}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>슬러그</span>
                  <input
                    className={styles.fieldInput}
                    value={knowledgeSlug}
                    onChange={(event) =>
                      onKnowledgeSlugChange(event.target.value)
                    }
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
                    onChange={(event) =>
                      onKnowledgeTitleChange(event.target.value)
                    }
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
                  onChange={(event) =>
                    onKnowledgeBodyChange(event.target.value)
                  }
                />
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>이미지 URL</span>
                <input
                  className={styles.fieldInput}
                  value={knowledgeImageUrl}
                  onChange={(event) =>
                    onKnowledgeImageUrlChange(event.target.value)
                  }
                  placeholder="https://example.com/image.png"
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
