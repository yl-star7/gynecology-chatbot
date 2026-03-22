"use client";

import type { ReactNode } from "react";

import styles from "./AdminConsoleLayout.module.css";

type NavItem = {
  href: string;
  label: string;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/operations", label: "운영 상태" },
  { href: "/admin/accounts", label: "계정" },
  {
    href: "/admin/content",
    label: "콘텐츠",
    children: [
      { href: "/admin/content/documents", label: "문서" },
      { href: "/admin/content/static", label: "정적 문헌" },
      { href: "/admin/content/weeks", label: "주차 데이터" },
      { href: "/admin/content/policies", label: "응답 정책" },
    ],
  },
  { href: "/admin/monitoring", label: "모니터링" },
];

interface AdminConsoleShellProps {
  adminDisplayName: string;
  currentPath: string;
  title: string;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}

function isActivePath(currentPath: string, href: string) {
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function AdminConsoleShell({
  adminDisplayName,
  currentPath,
  title,
  onLogout,
  children,
}: AdminConsoleShellProps) {
  return (
    <main className={styles.consoleRoot}>
      <aside className={styles.sidebar}>
        <div>
          <h1 className={styles.brandHeading}>운영 제어 센터</h1>
        </div>

        <nav aria-label="관리자 탐색" className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(currentPath, item.href);

            return (
              <div key={item.href} className={styles.navGroup}>
                {item.children ? (
                  <div
                    className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                  >
                    {item.label}
                  </div>
                ) : (
                  <a
                    className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                    href={item.href}
                  >
                    {item.label}
                  </a>
                )}

                {item.children ? (
                  <div className={styles.subnav}>
                    {item.children.map((child) => (
                      <a
                        key={child.href}
                        className={`${styles.subnavItem} ${
                          currentPath === child.href ? styles.subnavItemActive : ""
                        }`}
                        href={child.href}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className={styles.sideNote}>
          <span className={styles.metaLabel}>운영자</span>
          <strong>{adminDisplayName}</strong>
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.topbar}>
          <h2 className={styles.topbarHeading}>{title}</h2>

          <div className={styles.topbarActions}>
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
