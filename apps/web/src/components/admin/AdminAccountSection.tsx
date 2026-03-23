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
  const selectedUser =
    managedUsers.find((user) => user.id === selectedUserId) ?? managedUsers[0] ?? null;
  const activeUserCount = managedUsers.filter((user) => user.status === "active").length;
  const attentionUserCount = managedUsers.filter((user) => user.status === "attention").length;
  const latestRecoveryAction = recoveryActions[0]?.requestedAt ?? "기록 없음";

  return (
    <section className={styles.sectionStack}>
      <section className={styles.statsGrid}>
        <div className={styles.panelStat}>
          <span className={styles.metaLabel}>관리 대상 계정</span>
          <strong>{managedUsers.length}</strong>
        </div>
        <div className={styles.panelStat}>
          <span className={styles.metaLabel}>즉시 대응 필요</span>
          <strong>{attentionUserCount}</strong>
        </div>
        <div className={styles.panelStat}>
          <span className={styles.metaLabel}>정상 상태</span>
          <strong>{activeUserCount}</strong>
        </div>
        <div className={styles.panelStat}>
          <span className={styles.metaLabel}>최근 조치 시각</span>
          <strong>{latestRecoveryAction}</strong>
        </div>
      </section>

      <section className={styles.panelGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>조치 대상 선택</h2>
              <p className={styles.panelDescription}>
                문제가 있는 계정을 먼저 고르고, 현재 상태를 확인한 뒤 조치를 진행합니다.
              </p>
            </div>
          </div>

          <div className={styles.list}>
            {managedUsers.map((user) => (
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
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>선택 계정 조치</h2>
              <p className={styles.panelDescription}>
                대상 계정의 전화번호를 정정하거나 접근 문제를 초기화합니다.
              </p>
            </div>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.panelStat}>
              <span className={styles.metaLabel}>선택 계정</span>
              <strong>{selectedUser?.name ?? "선택된 계정 없음"}</strong>
              <span className={styles.listMeta}>{selectedUser?.phoneNumber ?? "-"}</span>
            </div>
            <div className={styles.panelStat}>
              <span className={styles.metaLabel}>현재 상태</span>
              <strong>
                {selectedUser ? getManagedUserStatusLabel(selectedUser.status) : "-"}
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

            {actionMessage ? <p className={styles.formHint}>{actionMessage}</p> : null}
          </div>
        </section>
      </section>

      <section className={styles.panelGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>최근 운영 조치</h2>
              <p className={styles.panelDescription}>
                어떤 계정에 어떤 조치를 했는지 최근 이력을 빠르게 확인합니다.
              </p>
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
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>허용 번호 운영 원칙</h2>
              <p className={styles.panelDescription}>
                허용 목록은 가입 및 복구 가능 대상을 정하는 운영 기준입니다. 선택한 번호를
                수정하거나 삭제하기 전에 메모와 표시 이름을 함께 확인하세요.
              </p>
            </div>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.panelStat}>
              <span className={styles.metaLabel}>허용 번호 수</span>
              <strong>{allowedPhoneNumbers.length}</strong>
            </div>
            <div className={styles.panelStat}>
              <span className={styles.metaLabel}>선택된 번호</span>
              <strong>{allowedPhoneNumber || "선택된 번호 없음"}</strong>
            </div>
          </div>
        </section>
      </section>

      <section className={`${styles.panel} ${styles.panelWide}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>허용 전화번호 관리</h2>
            <p className={styles.panelDescription}>
              가입 또는 복구를 허용할 번호를 등록하고, 선택한 번호를 바로 수정하거나
              삭제합니다.
            </p>
          </div>
        </div>

        <div className={styles.managementGrid}>
          <div className={styles.list}>
            {allowedPhoneNumbers.map((entry) => (
              <button
                key={entry.id}
                className={`${styles.listButton} ${
                  selectedAllowedPhoneId === entry.id ? styles.listButtonSelected : ""
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
