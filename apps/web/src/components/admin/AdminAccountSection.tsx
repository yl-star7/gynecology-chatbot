"use client";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

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
  selectedUserId: string;
  phoneNumber: string;
  reason: string;
  actionMessage: string | null;
  isSubmitting: boolean;
  onSelectUser: (userId: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onUpdatePhoneNumber: () => Promise<void>;
  onResetPassword: () => Promise<void>;
}

export function AdminAccountSection({
  managedUsers,
  recoveryActions,
  selectedUserId,
  phoneNumber,
  reason,
  actionMessage,
  isSubmitting,
  onSelectUser,
  onPhoneNumberChange,
  onReasonChange,
  onUpdatePhoneNumber,
  onResetPassword,
}: AdminAccountSectionProps) {
  return (
    <section className={styles.panelGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Action Queue</p>
            <h2 className={styles.panelTitle}>계정 조치 큐</h2>
            <p className={styles.panelDescription}>
              운영자가 바로 처리해야 하는 사용자 상태를 우선순위로 정렬합니다.
            </p>
          </div>
          <span className={`${styles.statusBadge} ${styles.statusWarning}`}>
            Priority
          </span>
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
            <p className={styles.eyebrow}>Audit Trail</p>
            <h2 className={styles.panelTitle}>운영 감사 로그</h2>
            <p className={styles.panelDescription}>
              최근 조치 이력과 수동 계정 업데이트를 같은 맥락에서 처리합니다.
            </p>
          </div>
          <span className={`${styles.statusBadge} ${styles.tagAccent}`}>Audit</span>
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
              onClick={onResetPassword}
            >
              비밀번호 재설정
            </button>
          </div>

          {actionMessage ? (
            <p className={styles.formHint}>{actionMessage}</p>
          ) : null}
        </div>
      </section>
    </section>
  );
}
