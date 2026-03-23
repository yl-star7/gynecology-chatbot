"use client";

import { useEffect, useState, type ReactNode } from "react";

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
      { href: "/admin/content/weeks", label: "주차별 간호 정보" },
      { href: "/admin/content/policies", label: "응답 워크플로우" },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    function syncSidebarVisibility() {
      setIsSidebarOpen(window.innerWidth >= 1024);
    }

    syncSidebarVisibility();
    window.addEventListener("resize", syncSidebarVisibility);
    return () => window.removeEventListener("resize", syncSidebarVisibility);
  }, []);

  return (
    <main className={styles.consoleRoot}>
      {isSidebarOpen ? (
        <button
          aria-label="사이드바 닫기"
          className={styles.sidebarBackdrop}
          type="button"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}
      <aside
        className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ""}`}
      >
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
          <div className={styles.topbarLead}>
            <button
              aria-label={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
              className={styles.sidebarToggle}
              type="button"
              onClick={() => setIsSidebarOpen((current) => !current)}
            >
              {isSidebarOpen ? "닫기" : "메뉴"}
            </button>
            <h2 className={styles.topbarHeading}>{title}</h2>
          </div>

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
