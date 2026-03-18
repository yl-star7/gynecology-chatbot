"use client";

import type { ReactNode } from "react";

import styles from "./AdminConsoleLayout.module.css";

const NAV_ITEMS = ["운영 상태", "계정", "지식 문서", "모니터링"] as const;

interface AdminConsoleShellProps {
  adminDisplayName: string;
  attentionUserCount: number;
  readyDocumentCount: number;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}

export function AdminConsoleShell({
  adminDisplayName,
  attentionUserCount,
  readyDocumentCount,
  onLogout,
  children,
}: AdminConsoleShellProps) {
  return (
    <main className={styles.consoleRoot}>
      <aside className={styles.sidebar}>
        <div>
          <p className={styles.eyebrow}>IBM Carbon Admin</p>
          <h1 className={styles.brandHeading}>운영 제어 센터</h1>
          <p className={styles.brandCopy}>
            계정 큐, 문서 반영, 사용자 모니터링을 한 화면에서 정리하는 운영
            콘솔입니다.
          </p>
        </div>

        <nav aria-label="관리자 탐색" className={styles.nav}>
          {NAV_ITEMS.map((item, index) => (
            <button
              key={item}
              className={`${styles.navItem} ${index === 0 ? styles.navItemActive : ""}`}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className={styles.sideNote}>
          <p className={styles.eyebrow}>Session</p>
          <strong>운영자 세션</strong>
          <p className={styles.panelDescription}>
            회원가입 흐름이 아니라 권한 검증을 마친 운영 계정이 바로 진입하는
            제어 화면입니다.
          </p>
        </div>

        <div className={styles.badgeRow}>
          <span className={`${styles.tag} ${styles.tagActive}`}>Gray 10</span>
          <span className={`${styles.tag} ${styles.tagAccent}`}>Policy</span>
          <span className={styles.tag}>Audit</span>
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Operations</p>
            <h2 className={styles.topbarHeading}>운영 상태</h2>
          </div>

          <div className={styles.topbarActions}>
            <div className={styles.metaGrid}>
              <div className={styles.metaCard}>
                <span className={styles.metaLabel}>운영자 세션</span>
                <strong className={styles.metaValue}>{adminDisplayName}</strong>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.metaLabel}>조치 필요</span>
                <strong className={styles.metaValue}>{attentionUserCount}</strong>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.metaLabel}>배포 가능 문서</span>
                <strong className={styles.metaValue}>{readyDocumentCount}</strong>
              </div>
            </div>

            <button
              className={styles.secondaryButton}
              type="button"
              onClick={onLogout}
            >
              세션 종료
            </button>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </section>
    </main>
  );
}
