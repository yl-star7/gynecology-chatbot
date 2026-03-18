"use client";

import { useState } from "react";

import type { AdminDashboardData, AdminHistoryUser } from "@gynecology-chatbot/app-core";

import { getSessionRoleBadge, getSessionRoleLabel } from "./admin-dashboard-labels";
import styles from "./AdminConsoleLayout.module.css";

interface AdminMonitoringSectionProps {
  userActions: AdminDashboardData["userActions"];
  historyUsers: AdminDashboardData["historyUsers"];
  focusedHistoryUser: AdminHistoryUser | undefined;
  focusedUserActions: AdminDashboardData["userActions"];
  onFocusUser: (userId: string) => void;
}

export function AdminMonitoringSection({
  userActions,
  historyUsers,
  focusedHistoryUser,
  focusedUserActions,
  onFocusUser,
}: AdminMonitoringSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActionType, setSelectedActionType] = useState("all");
  const [actionPage, setActionPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const actionTypeOptions = Array.from(
    new Set(userActions.map((action) => action.actionType)),
  );
  const filteredUserActions = userActions.filter((action) => {
    const matchesType =
      selectedActionType === "all" || action.actionType === selectedActionType;
    const matchesQuery =
      !normalizedQuery ||
      action.userName.toLowerCase().includes(normalizedQuery) ||
      action.actionLabel.toLowerCase().includes(normalizedQuery) ||
      action.detail.toLowerCase().includes(normalizedQuery) ||
      (action.sessionTitle ?? "").toLowerCase().includes(normalizedQuery);

    return matchesType && matchesQuery;
  });
  const filteredHistoryUsers = historyUsers.filter((user) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      user.name.toLowerCase().includes(normalizedQuery) ||
      user.phoneNumber.toLowerCase().includes(normalizedQuery) ||
      user.pregnancyWeekLabel.toLowerCase().includes(normalizedQuery)
    );
  });
  const ACTIONS_PER_PAGE = 8;
  const USERS_PER_PAGE = 4;
  const paginatedUserActions = filteredUserActions.slice(
    (actionPage - 1) * ACTIONS_PER_PAGE,
    actionPage * ACTIONS_PER_PAGE,
  );
  const paginatedHistoryUsers = filteredHistoryUsers.slice(
    (userPage - 1) * USERS_PER_PAGE,
    userPage * USERS_PER_PAGE,
  );
  const totalActionPages = Math.max(
    1,
    Math.ceil(filteredUserActions.length / ACTIONS_PER_PAGE),
  );
  const totalUserPages = Math.max(
    1,
    Math.ceil(filteredHistoryUsers.length / USERS_PER_PAGE),
  );

  return (
    <section className={styles.panelGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Live Activity</p>
            <h2 className={styles.panelTitle}>실시간 사용자 이벤트</h2>
            <p className={styles.panelDescription}>
              사용자 흐름은 운영 피드로만 두고, 조치 큐보다 아래 순서에 배치합니다.
            </p>
          </div>
          <span className={styles.statusBadge}>Feed</span>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.panelGrid}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>이벤트 검색</span>
              <input
                className={styles.fieldInput}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setActionPage(1);
                  setUserPage(1);
                }}
              />
            </label>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>액션 타입</span>
              <select
                className={styles.fieldSelect}
                value={selectedActionType}
                onChange={(event) => {
                  setSelectedActionType(event.target.value);
                  setActionPage(1);
                }}
              >
                <option value="all">all</option>
                {actionTypeOptions.map((actionType) => (
                  <option key={actionType} value={actionType}>
                    {actionType}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className={styles.list}>
          {paginatedUserActions.map((action) => (
            <div key={action.id} className={styles.listRow}>
              <div className={styles.listDetail}>
                <strong className={styles.listPrimary}>{action.userName}</strong>
                <span className={styles.listMeta}>
                  {action.actionLabel} · {action.detail}
                </span>
              </div>
              <div className={styles.listMetaGroup}>
                <span className={styles.statusBadge}>
                  {action.sessionTitle ?? "계정 이벤트"}
                </span>
                <span className={styles.listMeta}>{action.occurredAtLabel}</span>
              </div>
            </div>
          ))}
          {paginatedUserActions.length === 0 ? (
            <div className={styles.listEmpty}>조건에 맞는 이벤트가 없습니다.</div>
          ) : null}
        </div>

        <div className={styles.actionRow}>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={actionPage === 1}
            onClick={() => setActionPage((current) => Math.max(1, current - 1))}
          >
            이전 이벤트
          </button>
          <span className={styles.formHint}>
            {actionPage} / {totalActionPages}
          </span>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={actionPage >= totalActionPages}
            onClick={() =>
              setActionPage((current) => Math.min(totalActionPages, current + 1))
            }
          >
            다음 이벤트
          </button>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Conversation Audit</p>
            <h2 className={styles.panelTitle}>채팅 세션 감사</h2>
            <p className={styles.panelDescription}>
              선택 사용자 기준으로 최근 세션과 감사 로그를 한 번에 조회합니다.
            </p>
          </div>
          <span className={styles.statusBadge}>Sessions</span>
        </div>

        <div className={styles.historyGrid}>
          <div className={styles.list}>
            {paginatedHistoryUsers.map((user) => (
              <button
                key={user.id}
                className={styles.listButton}
                type="button"
                onClick={() => onFocusUser(user.id)}
              >
                <div className={styles.listDetail}>
                  <strong className={styles.listPrimary}>{user.name}</strong>
                  <span className={styles.listMeta}>
                    {user.phoneNumber} · {user.pregnancyWeekLabel}
                  </span>
                </div>
                <div className={styles.listMetaGroup}>
                  <span className={styles.statusBadge}>최근 세션</span>
                  <span className={styles.listMeta}>{user.latestSessionLabel}</span>
                </div>
              </button>
            ))}
            {paginatedHistoryUsers.length === 0 ? (
              <div className={styles.listEmpty}>조건에 맞는 사용자가 없습니다.</div>
            ) : null}
          </div>

          <div className={styles.actionRow}>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={userPage === 1}
              onClick={() => setUserPage((current) => Math.max(1, current - 1))}
            >
              이전 사용자
            </button>
            <span className={styles.formHint}>
              {userPage} / {totalUserPages}
            </span>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={userPage >= totalUserPages}
              onClick={() =>
                setUserPage((current) => Math.min(totalUserPages, current + 1))
              }
            >
              다음 사용자
            </button>
          </div>

          {focusedHistoryUser ? (
            <div className={styles.formGrid}>
              <div className={styles.historyStats}>
                <div className={styles.historyStat}>
                  <span className={styles.metaLabel}>선택 사용자</span>
                  <strong>{focusedHistoryUser.name}</strong>
                </div>
                <div className={styles.historyStat}>
                  <span className={styles.metaLabel}>전화번호</span>
                  <strong>{focusedHistoryUser.phoneNumber}</strong>
                </div>
                <div className={styles.historyStat}>
                  <span className={styles.metaLabel}>임신 주차</span>
                  <strong>{focusedHistoryUser.pregnancyWeekLabel}</strong>
                </div>
                <div className={styles.historyStat}>
                  <span className={styles.metaLabel}>최근 채팅</span>
                  <strong>{focusedHistoryUser.latestSessionLabel}</strong>
                </div>
              </div>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>User Audit</p>
                    <h3 className={styles.panelTitle}>선택 사용자 감사 로그</h3>
                  </div>
                  <span className={styles.statusBadge}>Account</span>
                </div>

                <div className={styles.list}>
                  {focusedUserActions.length > 0 ? (
                    focusedUserActions.map((action) => (
                      <div key={action.id} className={styles.listRow}>
                        <div className={styles.listDetail}>
                          <strong className={styles.listPrimary}>
                            {action.actionLabel}
                          </strong>
                          <span className={styles.listMeta}>{action.detail}</span>
                        </div>
                        <div className={styles.listMetaGroup}>
                          <span className={styles.statusBadge}>
                            {action.sessionTitle ?? "계정 이벤트"}
                          </span>
                          <span className={styles.listMeta}>
                            {action.occurredAtLabel}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.listEmpty}>
                      선택한 사용자의 계정 이벤트가 아직 없습니다.
                    </div>
                  )}
                </div>
              </section>

              <div className={styles.sessionGrid}>
                {focusedHistoryUser.sessions.map((session) => (
                  <section key={session.id} className={styles.panel}>
                    <div className={styles.panelHeader}>
                      <div>
                        <p className={styles.eyebrow}>Conversation</p>
                        <h3 className={styles.panelTitle}>{session.title}</h3>
                      </div>
                      <span className={`${styles.statusBadge} ${styles.tagAccent}`}>
                        {session.pregnancyWeekLabel}
                      </span>
                    </div>

                    <div className={styles.list}>
                      {session.messages.map((message) => (
                        <div key={message.id} className={styles.listRow}>
                          <div className={styles.listDetail}>
                            <strong className={styles.listPrimary}>
                              {getSessionRoleLabel(message.role)}
                            </strong>
                            <span className={styles.listMeta}>{message.summary}</span>
                          </div>
                          <div className={styles.listMetaGroup}>
                            <span
                              className={`${styles.statusBadge} ${styles[getSessionRoleBadge(message.role)] ?? ""}`}
                            >
                              {getSessionRoleLabel(message.role)}
                            </span>
                            <span className={styles.listMeta}>
                              {message.createdAtLabel}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
