"use client";

import type {
  AdminAllowedPhoneNumber,
  AdminDashboardData,
} from "@gynecology-chatbot/app-core";

import {
  getManagedUserStatusBadge,
  getManagedUserStatusLabel,
} from "./admin-dashboard-labels";
import styles from "./AdminConsoleLayout.module.css";

interface AdminAccountSectionProps {
  managedUsers: AdminDashboardData["managedUsers"];
  allowedPhoneNumbers: AdminAllowedPhoneNumber[];
  userSearchQuery: string;
  selectedUserId: string;
  phoneNumber: string;
  reason: string;
  selectedAllowedPhoneId: string;
  allowedPhoneNumber: string;
  allowedDisplayName: string;
  allowedNote: string;
  actionMessage: string | null;
  isSubmitting: boolean;
  onUserSearchQueryChange: (value: string) => void;
  onSelectUser: (userId: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSelectAllowedPhone: (id: string) => void;
  onAllowedPhoneNumberChange: (value: string) => void;
  onAllowedDisplayNameChange: (value: string) => void;
  onAllowedNoteChange: (value: string) => void;
  onUpdatePhoneNumber: () => Promise<void>;
  onResetSession: () => Promise<void>;
  onPauseUser: () => Promise<void>;
  onResumeUser: () => Promise<void>;
  onCreateAllowedPhoneNumber: () => Promise<void>;
  onUpdateAllowedPhoneNumber: () => Promise<void>;
  onDeleteAllowedPhoneNumber: () => Promise<void>;
}

export function AdminAccountSection({
  managedUsers,
  allowedPhoneNumbers,
  userSearchQuery,
  selectedUserId,
  phoneNumber,
  reason,
  selectedAllowedPhoneId,
  allowedPhoneNumber,
  allowedDisplayName,
  allowedNote,
  actionMessage,
  isSubmitting,
  onUserSearchQueryChange,
  onSelectUser,
  onPhoneNumberChange,
  onReasonChange,
  onSelectAllowedPhone,
  onAllowedPhoneNumberChange,
  onAllowedDisplayNameChange,
  onAllowedNoteChange,
  onUpdatePhoneNumber,
  onResetSession,
  onPauseUser,
  onResumeUser,
  onCreateAllowedPhoneNumber,
  onUpdateAllowedPhoneNumber,
  onDeleteAllowedPhoneNumber,
}: AdminAccountSectionProps) {
  const normalizedUserSearchQuery = userSearchQuery.trim().toLowerCase();
  const filteredManagedUsers = managedUsers.filter((user) => {
    if (!normalizedUserSearchQuery) {
      return true;
    }

    return (
      user.name.toLowerCase().includes(normalizedUserSearchQuery) ||
      user.phoneNumber.toLowerCase().includes(normalizedUserSearchQuery) ||
      user.latestIssue.toLowerCase().includes(normalizedUserSearchQuery)
    );
  });
  const selectedUser =
    managedUsers.find((user) => user.id === selectedUserId) ??
    managedUsers[0] ??
    null;

  return (
    <section className={styles.sectionStack}>
      <section className={styles.panelGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>사용자 선택</h2>
              <p className={styles.panelDescription}>
                가끔 수정이 필요한 사용자를 고르고, 전화번호나 접근 문제를 바로
                정리합니다.
              </p>
            </div>
          </div>

          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>사용자 검색</span>
            <input
              className={styles.fieldInput}
              value={userSearchQuery}
              onChange={(event) => onUserSearchQueryChange(event.target.value)}
              placeholder="이름, 전화번호, 최근 이슈"
            />
          </label>

          <div className={styles.list}>
            {filteredManagedUsers.map((user) => (
              <button
                key={user.id}
                className={`${styles.listButton} ${
                  selectedUserId === user.id ? styles.listButtonSelected : ""
                }`}
                type="button"
                aria-pressed={selectedUserId === user.id}
                onClick={() => onSelectUser(user.id)}
              >
                <div className={styles.listDetail}>
                  <strong className={styles.listPrimary}>{user.name}</strong>
                  <span className={styles.listMeta}>{user.phoneNumber}</span>
                </div>
                <div className={styles.listMetaGroup}>
                  <span
                    className={`${styles.statusBadge} ${styles[getManagedUserStatusBadge(user.status)] ?? ""}`}
                  >
                    {getManagedUserStatusLabel(user.status)}
                  </span>
                  <span className={styles.listMeta}>{user.latestIssue}</span>
                </div>
              </button>
            ))}
            {filteredManagedUsers.length === 0 ? (
              <div className={styles.listEmpty}>
                조건에 맞는 사용자가 없습니다.
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>선택 사용자 수정</h2>
              <p className={styles.panelDescription}>
                선택한 사용자의 전화번호를 바꾸거나 접근 문제를 초기화합니다.
              </p>
            </div>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.panelStat}>
              <span className={styles.metaLabel}>선택 계정</span>
              <strong>{selectedUser?.name ?? "선택된 계정 없음"}</strong>
              <span className={styles.listMeta}>
                {selectedUser?.phoneNumber ?? "-"}
              </span>
            </div>
            <div className={styles.panelStat}>
              <span className={styles.metaLabel}>현재 상태</span>
              <strong>
                {selectedUser
                  ? getManagedUserStatusLabel(selectedUser.status)
                  : "-"}
              </strong>
              <span className={styles.listMeta}>
                {selectedUser?.latestIssue ?? "최근 이슈 없음"}
              </span>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>조치 대상</span>
              <select
                className={styles.fieldSelect}
                value={selectedUserId}
                onChange={(event) => onSelectUser(event.target.value)}
              >
                {filteredManagedUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.phoneNumber}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>변경 전화번호</span>
              <input
                className={styles.fieldInput}
                value={phoneNumber}
                onChange={(event) => onPhoneNumberChange(event.target.value)}
              />
            </label>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>조치 메모</span>
              <textarea
                className={styles.fieldTextarea}
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
              />
            </label>

            <div className={styles.actionRow}>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={isSubmitting}
                onClick={onUpdatePhoneNumber}
              >
                전화번호 갱신
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isSubmitting}
                onClick={onResetSession}
              >
                세션 초기화
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isSubmitting}
                onClick={onPauseUser}
              >
                사용 중단
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isSubmitting}
                onClick={onResumeUser}
              >
                사용 재개
              </button>
            </div>

            {actionMessage ? (
              <p className={styles.formHint}>{actionMessage}</p>
            ) : null}
          </div>
        </section>
      </section>

      <section className={`${styles.panel} ${styles.panelWide}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>허용 전화번호 관리</h2>
            <p className={styles.panelDescription}>
              번호 추가, 수정, 삭제만 빠르게 할 수 있게 정리한 화면입니다.
            </p>
          </div>
        </div>

        <div className={styles.managementGrid}>
          <div className={styles.list}>
            {allowedPhoneNumbers.map((entry) => (
              <button
                key={entry.id}
                className={`${styles.listButton} ${
                  selectedAllowedPhoneId === entry.id
                    ? styles.listButtonSelected
                    : ""
                }`}
                type="button"
                aria-pressed={selectedAllowedPhoneId === entry.id}
                onClick={() => onSelectAllowedPhone(entry.id)}
              >
                <div className={styles.listDetail}>
                  <strong className={styles.listPrimary}>
                    {entry.displayName || "이름 없음"}
                  </strong>
                  <span className={styles.listMeta}>{entry.phoneNumber}</span>
                </div>
                <div className={styles.listMetaGroup}>
                  <span className={styles.statusBadge}>허용</span>
                  <span className={styles.listMeta}>
                    {entry.note || "메모 없음"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className={styles.formGrid}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>허용 전화번호</span>
              <input
                className={styles.fieldInput}
                value={allowedPhoneNumber}
                onChange={(event) =>
                  onAllowedPhoneNumberChange(event.target.value)
                }
              />
            </label>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>표시 이름</span>
              <input
                className={styles.fieldInput}
                value={allowedDisplayName}
                onChange={(event) =>
                  onAllowedDisplayNameChange(event.target.value)
                }
              />
            </label>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>메모</span>
              <textarea
                className={styles.fieldTextarea}
                value={allowedNote}
                onChange={(event) => onAllowedNoteChange(event.target.value)}
              />
            </label>

            <div className={styles.actionRow}>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={isSubmitting}
                onClick={onCreateAllowedPhoneNumber}
              >
                허용 번호 추가
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isSubmitting}
                onClick={onUpdateAllowedPhoneNumber}
              >
                선택 번호 수정
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isSubmitting || !selectedAllowedPhoneId}
                onClick={onDeleteAllowedPhoneNumber}
              >
                선택 번호 삭제
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
