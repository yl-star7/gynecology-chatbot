"use client";

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

        <div className={styles.list}>
          {userActions.slice(0, 12).map((action) => (
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
            {historyUsers.map((user) => (
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
