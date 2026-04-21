"use client";

import { useState } from "react";

import type {
  HomeCopyItem,
  HomeCopySlot,
  HomeCopyStatus,
} from "@gynecology-chatbot/app-core";

import styles from "../AdminConsoleLayout.module.css";

const SLOT_LABELS: Record<HomeCopySlot, string> = {
  hero_bubble: "아기 말풍선",
  daily_note: "오늘의 한마디",
  encouragement_quote: "응원 문구",
};

export interface AdminHomeCopyPanelProps {
  homeCopyItems: HomeCopyItem[];
  selectedHomeCopyItemId: string;
  contentMessage: string | null;
  homeCopySlot: HomeCopySlot;
  homeCopyVariant: string;
  homeCopyTitle: string;
  homeCopyBody: string;
  homeCopyStatus: HomeCopyStatus;
  homeCopyDisplayOrder: string;
  isHomeCopySaving: boolean;
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
}

export function AdminHomeCopyPanel({
  homeCopyItems,
  selectedHomeCopyItemId,
  contentMessage,
  homeCopySlot,
  homeCopyVariant,
  homeCopyTitle,
  homeCopyBody,
  homeCopyDisplayOrder,
  isHomeCopySaving,
  onSelectHomeCopyItem,
  onHomeCopySlotChange,
  onHomeCopyVariantChange,
  onHomeCopyTitleChange,
  onHomeCopyBodyChange,
  onHomeCopyDisplayOrderChange,
  onCreateHomeCopyItem,
  onUpdateHomeCopyItem,
  onDeleteHomeCopyItem,
  onResetHomeCopyItem,
}: AdminHomeCopyPanelProps) {
  const [activeOverlay, setActiveOverlay] = useState(false);
  const [query, setQuery] = useState("");
  const [slotFilter, setSlotFilter] = useState<HomeCopySlot | "all">("all");

  const selectedItem =
    homeCopyItems.find((item) => item.id === selectedHomeCopyItemId) ?? null;
  const filteredItems = homeCopyItems.filter((item) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.body.toLowerCase().includes(normalizedQuery) ||
      (item.variant ?? "").toLowerCase().includes(normalizedQuery);
    const matchesSlot = slotFilter === "all" || item.slot === slotFilter;
    return matchesQuery && matchesSlot;
  });

  return (
    <section className={styles.panel}>
      <div className={styles.routeHeader}>
        <div>
          <h2 className={styles.routeTitle}>앱 메인 문구</h2>
          <p className={styles.panelDescription}>
            홈 화면 말풍선, 오늘의 한마디, 응원 문구를 관리합니다.
          </p>
        </div>
        <div className={styles.topbarActions}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => {
              onResetHomeCopyItem();
              setActiveOverlay(true);
            }}
          >
            새 문구
          </button>
        </div>
      </div>

      <div className={styles.tableToolbar}>
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>검색</span>
          <input
            className={styles.fieldInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 본문, 대상"
          />
        </label>
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>위치</span>
          <select
            className={styles.fieldSelect}
            value={slotFilter}
            onChange={(event) =>
              setSlotFilter(event.target.value as HomeCopySlot | "all")
            }
          >
            <option value="all">전체</option>
            <option value="hero_bubble">{SLOT_LABELS.hero_bubble}</option>
            <option value="daily_note">{SLOT_LABELS.daily_note}</option>
            <option value="encouragement_quote">
              {SLOT_LABELS.encouragement_quote}
            </option>
          </select>
        </label>
      </div>

      <div className={styles.dataTable}>
        <div className={styles.dataTableHeader}>
          <span>제목</span>
          <span>위치</span>
          <span>대상</span>
          <span>순서</span>
        </div>
        {filteredItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.dataTableRow} ${
              selectedHomeCopyItemId === item.id
                ? styles.dataTableRowActive
                : ""
            }`}
            type="button"
            onClick={() => {
              onSelectHomeCopyItem(item.id);
              setActiveOverlay(true);
            }}
          >
            <span className={styles.dataTableTitleGroup}>
              <strong>{item.title}</strong>
              <small>{item.body}</small>
            </span>
            <span>{SLOT_LABELS[item.slot]}</span>
            <span>{item.variant ?? "전체"}</span>
            <span>{item.displayOrder}</span>
          </button>
        ))}
        {filteredItems.length === 0 ? (
          <div className={styles.listEmpty}>조건에 맞는 문구가 없습니다.</div>
        ) : null}
      </div>

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
                  {selectedItem ? "메인 문구 편집" : "새 메인 문구"}
                </h3>
                <p className={styles.panelDescription}>
                  저장한 문구는 바로 앱 홈 화면 후보에 반영됩니다.
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
                  <span className={styles.fieldLabel}>위치</span>
                  <select
                    className={styles.fieldSelect}
                    value={homeCopySlot}
                    onChange={(event) =>
                      onHomeCopySlotChange(event.target.value as HomeCopySlot)
                    }
                  >
                    <option value="hero_bubble">
                      {SLOT_LABELS.hero_bubble}
                    </option>
                    <option value="daily_note">{SLOT_LABELS.daily_note}</option>
                    <option value="encouragement_quote">
                      {SLOT_LABELS.encouragement_quote}
                    </option>
                  </select>
                </label>
              </div>
              <div className={styles.panelGrid}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>대상</span>
                  <input
                    className={styles.fieldInput}
                    value={homeCopyVariant}
                    onChange={(event) =>
                      onHomeCopyVariantChange(event.target.value)
                    }
                    placeholder="default, unknown, 차분하게"
                  />
                </label>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>순서</span>
                  <input
                    className={styles.fieldInput}
                    type="number"
                    value={homeCopyDisplayOrder}
                    onChange={(event) =>
                      onHomeCopyDisplayOrderChange(event.target.value)
                    }
                  />
                </label>
              </div>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>제목</span>
                <input
                  className={styles.fieldInput}
                  value={homeCopyTitle}
                  onChange={(event) =>
                    onHomeCopyTitleChange(event.target.value)
                  }
                />
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>문구</span>
                <textarea
                  className={styles.overlayTextarea}
                  value={homeCopyBody}
                  onChange={(event) => onHomeCopyBodyChange(event.target.value)}
                />
              </label>
              <p className={styles.formHint}>
                사용할 수 있는 값: {"{babyName}"}, {"{pregnancyWeekLabel}"},{" "}
                {"{tone}"}
              </p>
            </div>
            <div className={styles.overlayFooter}>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isHomeCopySaving}
                onClick={onResetHomeCopyItem}
              >
                비우기
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isHomeCopySaving || !selectedHomeCopyItemId}
                onClick={onDeleteHomeCopyItem}
              >
                삭제
              </button>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={isHomeCopySaving}
                onClick={
                  selectedHomeCopyItemId
                    ? onUpdateHomeCopyItem
                    : onCreateHomeCopyItem
                }
              >
                {selectedHomeCopyItemId ? "문구 저장" : "문구 생성"}
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </section>
  );
}
