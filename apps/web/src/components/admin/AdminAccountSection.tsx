"use client";

import type {
  AdminAllowedPhoneNumber,
  AdminDashboardData,
} from "@gynecology-chatbot/app-core";

import {
  getManagedUserStatusBadge,
  getManagedUserStatusLabel,
  getRecoveryActionLabel,
  getRecoveryStatusBadge,
  getRecoveryStatusLabel,
} from "./admin-dashboard-labels";
import styles from "./AdminConsoleLayout.module.css";

interface AdminAccountSectionProps {
  managedUsers: AdminDashboardData["managedUsers"];
  recoveryActions: AdminDashboardData["recoveryActions"];
  allowedPhoneNumbers: AdminAllowedPhoneNumber[];
  selectedUserId: string;
  phoneNumber: string;
  reason: string;
  selectedAllowedPhoneId: string;
  allowedPhoneNumber: string;
  allowedDisplayName: string;
  allowedNote: string;
  actionMessage: string | null;
  isSubmitting: boolean;
  onSelectUser: (userId: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSelectAllowedPhone: (id: string) => void;
  onAllowedPhoneNumberChange: (value: string) => void;
  onAllowedDisplayNameChange: (value: string) => void;
  onAllowedNoteChange: (value: string) => void;
  onUpdatePhoneNumber: () => Promise<void>;
  onResetSession: () => Promise<void>;
  onCreateAllowedPhoneNumber: () => Promise<void>;
  onUpdateAllowedPhoneNumber: () => Promise<void>;
  onDeleteAllowedPhoneNumber: () => Promise<void>;
}

export function AdminAccountSection({
  managedUsers,
  recoveryActions,
  allowedPhoneNumbers,
  selectedUserId,
  phoneNumber,
  reason,
  selectedAllowedPhoneId,
  allowedPhoneNumber,
  allowedDisplayName,
  allowedNote,
  actionMessage,
  isSubmitting,
  onSelectUser,
  onPhoneNumberChange,
  onReasonChange,
  onSelectAllowedPhone,
  onAllowedPhoneNumberChange,
  onAllowedDisplayNameChange,
  onAllowedNoteChange,
  onUpdatePhoneNumber,
  onResetSession,
  onCreateAllowedPhoneNumber,
  onUpdateAllowedPhoneNumber,
  onDeleteAllowedPhoneNumber,
}: AdminAccountSectionProps) {
  return (
    <section className={styles.panelGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>계정 조치 큐</h2>
          </div>
        </div>

        <div className={styles.list}>
          {managedUsers.map((user) => (
            <button
              key={user.id}
              className={styles.listButton}
              type="button"
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
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>운영 감사 로그</h2>
          </div>
        </div>

        <div className={styles.list}>
          {recoveryActions.map((action) => (
            <div key={action.id} className={styles.listRow}>
              <div className={styles.listDetail}>
                <strong className={styles.listPrimary}>{action.userName}</strong>
                <span className={styles.listMeta}>
                  {getRecoveryActionLabel(action.action)}
                </span>
              </div>
              <div className={styles.listMetaGroup}>
                <span
                  className={`${styles.statusBadge} ${styles[getRecoveryStatusBadge(action.status)] ?? ""}`}
                >
                  {getRecoveryStatusLabel(action.status)}
                </span>
                <span className={styles.listMeta}>{action.requestedAt}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.formGrid}>
          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>조치 대상</span>
            <select
              className={styles.fieldSelect}
              value={selectedUserId}
              onChange={(event) => onSelectUser(event.target.value)}
            >
              {managedUsers.map((user) => (
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
          </div>

          {actionMessage ? (
            <p className={styles.formHint}>{actionMessage}</p>
          ) : null}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>허용 전화번호 관리</h3>
            </div>
          </div>

          <div className={styles.list}>
            {allowedPhoneNumbers.map((entry) => (
              <button
                key={entry.id}
                className={styles.listButton}
                type="button"
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
                  <span className={styles.listMeta}>{entry.note || "메모 없음"}</span>
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
                onChange={(event) => onAllowedPhoneNumberChange(event.target.value)}
              />
            </label>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>표시 이름</span>
              <input
                className={styles.fieldInput}
                value={allowedDisplayName}
                onChange={(event) => onAllowedDisplayNameChange(event.target.value)}
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
